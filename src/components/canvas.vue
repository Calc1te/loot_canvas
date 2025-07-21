<template>
  <div id="canvas-container">
    <canvas ref="mirrorCanvas" width="1405" height="545" style="width: 1405px; height: 545px;"></canvas>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">FPS</div>
      <div class="stat-value">{{ actualFPS }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">最后更新时间</div>
      <div class="stat-value">{{ lastUpdate || '-' }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">状态</div>
      <div class="stat-value">{{ isCapturing ? '运行中' : '已停止' }}</div>
    </div>
  </div>
  
  <div class="controls">
    <button @click="toggleCapture" :class="{ active: isCapturing }">
      {{ isCapturing ? '停止抓取' : '开始抓取' }}
    </button>
    <button @click="initURL">
      initURL
    </button>
    <input v-model="updateInterval" type="number" min="100" max="5000" step="100" placeholder="更新间隔(ms)">
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      imageData: null,
      error: null,
      isCapturing: false,
      updateInterval: 500,
      actualFPS: 0,
      lastUpdate: null,
      captureTimer: null,
      fpsHistory: [],
      targetURL: 'http://mir.com/dashboards/mirconst-guid-0000-0001-dashboards00'
    }
  },
  methods: {
    async captureCanvas() {
      try {
        const response = await fetch(`http://localhost:3001/api/capture-canvas?url=${encodeURIComponent(this.targetURL)}`)
        const result = await response.json()
        
        if (result.success) {
          this.imageData = result.data
          this.drawCanvas(result.data)
          this.updateFPS()
          this.updateLastUpdateTime()
          this.error = null
        } else {
          this.error = result.error
        }
      } catch (error) {
        this.error = error.message
        console.error('Capture error:', error)
      }
    },
    
    drawCanvas(dataURL) {
      if (!this.$refs.mirrorCanvas || !dataURL) return
      
      const canvas = this.$refs.mirrorCanvas
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      
      img.onerror = () => {
        console.error('Failed to load image data')
      }
      
      img.src = dataURL
    },
    
    updateFPS() {
      const now = performance.now()
      this.fpsHistory.push(now)
      
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift()
      }
      
      if (this.fpsHistory.length > 1) {
        const duration = (this.fpsHistory[this.fpsHistory.length - 1] - this.fpsHistory[0]) / 1000
        this.actualFPS = Math.round((this.fpsHistory.length - 1) / duration)
      }
    },
    
    updateLastUpdateTime() {
      const now = new Date()
      this.lastUpdate = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    },
    
    startCapture() {
      if (this.captureTimer) return
      
      this.isCapturing = true
      this.captureTimer = setInterval(() => {
        this.captureCanvas()
      }, this.updateInterval)
      
      // Initial capture
      this.captureCanvas()
    },
    
    stopCapture() {
      if (this.captureTimer) {
        clearInterval(this.captureTimer)
        this.captureTimer = null
      }
      this.isCapturing = false
    },
    
    toggleCapture() {
      if (this.isCapturing) {
        this.stopCapture()
      } else {
        this.startCapture()
      }
    },
    async initURL(){
    try{
      const response = await fetch(`http://localhost:3001/api/init_url?url=${encodeURIComponent(this.targetURL)}`);
      console.log("init__")
    }catch (e) {
      return { success: false, error: e.message };
    }
    }
  },
  
  watch: {
    updateInterval(newInterval) {
      if (this.isCapturing) {
        this.stopCapture()
        this.startCapture()
      }
    }
  },
  
  beforeUnmount() {
    this.stopCapture()
  }
}
</script>

<style scoped>
#canvas-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  background: #f9f9f9;
}

.stats {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 20px 0;
}

.stat-card {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;
  min-width: 120px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
  text-transform: uppercase;
}

.stat-value {
  font-size: 18px;
  color: #333;
  font-weight: bold;
}

.controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
}

.controls button {
  padding: 10px 20px;
  border: 2px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.controls button:hover {
  background: #007bff;
  color: white;
}

.controls button.active {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.controls input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 150px;
}

.error {
  color: #dc3545;
  margin: 0;
  font-size: 14px;
}
</style>