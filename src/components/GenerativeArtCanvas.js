import React, { useState, useRef, useEffect } from 'react';

const GenerativeArtCanvas = () => {
  // キャンバスの状態管理
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  // パラメーター設定
  const [settings, setSettings] = useState({
    particleCount: 100,
    particleSize: 3,
    speed: 2,
    lineLength: 100,
    colorMode: 'rainbow', // rainbow, monochrome, custom
    baseHue: 180,
    saturation: 80,
    brightness: 80,
    fadeAmount: 5,
  });
  
  // パーティクル配列
  const [particles, setParticles] = useState([]);
  
  // マウス位置
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // パーティクルの初期化
  const initParticles = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    console.log("Canvas dimensions:", width, height); // デバッグ用

    const newParticles = [];
    
    for (let i = 0; i < settings.particleCount; i++) {
      newParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * settings.particleSize + 1,
        speedX: (Math.random() - 0.5) * settings.speed,
        speedY: (Math.random() - 0.5) * settings.speed,
        hue: Math.random() * 360,
      });
    }
    
    setParticles(newParticles);
    
    // 背景を黒で初期化
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    
    console.log("Particles initialized:", newParticles.length); // デバッグ用
  };
  
  // キャンバスサイズの設定
  const resizeCanvas = () => {
    if (canvasRef.current) {
      console.log("Resizing canvas"); // デバッグ用
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      initParticles();
    }
  };
  
  // コンポーネントマウント時の処理
  useEffect(() => {
    console.log("Component mounted"); // デバッグ用
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  
  // パラメーター変更時の処理
  useEffect(() => {
    initParticles();
  }, [settings.particleCount, settings.particleSize]);  // eslint-disable-line react-hooks/exhaustive-deps
  
  // マウス移動のイベントハンドラー
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    console.log("Adding mouse event listener"); // デバッグ用
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // アニメーションループ
  useEffect(() => {
    if (!isDrawing) return;
    
    console.log("Starting animation loop"); // デバッグ用
    
    const animate = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // 半透明の黒を重ねて残像効果を作る
      ctx.fillStyle = `rgba(0, 0, 0, ${settings.fadeAmount / 100})`;
      ctx.fillRect(0, 0, width, height);
      
      // パーティクルの更新と描画
      const updatedParticles = particles.map(particle => {
        // 位置の更新
        let newX = particle.x + particle.speedX;
        let newY = particle.y + particle.speedY;
        
        // マウスとの距離を計算
        const dx = mousePos.x - newX;
        const dy = mousePos.y - newY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // マウスに近いパーティクルは影響を受ける
        if (distance < settings.lineLength) {
          // マウスとの接続線を描画
          ctx.beginPath();
          ctx.moveTo(newX, newY);
          ctx.lineTo(mousePos.x, mousePos.y);
          
          // 線の色設定
          if (settings.colorMode === 'rainbow') {
            ctx.strokeStyle = `hsla(${particle.hue}, ${settings.saturation}%, ${settings.brightness}%, ${1 - distance / settings.lineLength})`;
          } else if (settings.colorMode === 'monochrome') {
            ctx.strokeStyle = `hsla(${settings.baseHue}, ${settings.saturation}%, ${settings.brightness}%, ${1 - distance / settings.lineLength})`;
          } else {
            ctx.strokeStyle = `hsla(${settings.baseHue}, ${settings.saturation}%, ${settings.brightness}%, ${1 - distance / settings.lineLength})`;
          }
          
          ctx.stroke();
          
          // マウスからの影響で速度変更
          particle.speedX += dx * 0.0005;
          particle.speedY += dy * 0.0005;
        }
        
        // 速度の制限
        const maxSpeed = settings.speed;
        particle.speedX = Math.max(-maxSpeed, Math.min(maxSpeed, particle.speedX));
        particle.speedY = Math.max(-maxSpeed, Math.min(maxSpeed, particle.speedY));
        
        // 画面外に出たら反対側から再登場
        if (newX < 0) newX = width;
        if (newX > width) newX = 0;
        if (newY < 0) newY = height;
        if (newY > height) newY = 0;
        
        // パーティクルの描画
        ctx.beginPath();
        ctx.arc(newX, newY, particle.size, 0, Math.PI * 2);
        
        if (settings.colorMode === 'rainbow') {
          particle.hue = (particle.hue + 0.5) % 360;
          ctx.fillStyle = `hsl(${particle.hue}, ${settings.saturation}%, ${settings.brightness}%)`;
        } else if (settings.colorMode === 'monochrome') {
          ctx.fillStyle = `hsl(${settings.baseHue}, ${settings.saturation}%, ${settings.brightness}%)`;
        } else {
          ctx.fillStyle = `hsl(${settings.baseHue}, ${settings.saturation}%, ${settings.brightness}%)`;
        }
        
        ctx.fill();
        
        return {
          ...particle,
          x: newX,
          y: newY
        };
      });
      
      setParticles(updatedParticles);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDrawing, particles, settings, mousePos]);
  
  // 画像の保存機能
  const saveCanvas = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'generative-art.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };
  
  // 設定の変更ハンドラー
  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Tailwindの代わりに従来のスタイルを使用
  const styles = {
    container: {
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'black'
    },
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
    },
    controlsContainer: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      display: 'flex',
      gap: '0.5rem'
    },
    controlButton: {
      backgroundColor: 'rgba(31, 41, 55, 0.8)',
      color: 'white',
      padding: '0.5rem',
      borderRadius: '9999px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2rem',
      height: '2rem',
      fontSize: '1rem'
    },
    settingsPanel: {
      position: 'absolute',
      top: '4rem',
      right: '1rem',
      backgroundColor: 'rgba(17, 24, 39, 0.8)',
      padding: '1rem',
      borderRadius: '0.5rem',
      color: 'white',
      width: '16rem',
      maxHeight: '100vh',
      overflowY: 'auto'
    },
    settingsTitle: {
      fontSize: '1.25rem',
      marginBottom: '1rem',
      fontWeight: 'bold'
    },
    settingsGroup: {
      marginBottom: '1rem'
    },
    settingLabel: {
      display: 'block',
      marginBottom: '0.25rem'
    },
    slider: {
      width: '100%'
    },
    select: {
      width: '100%',
      padding: '0.5rem',
      backgroundColor: 'rgba(31, 41, 55, 0.8)',
      color: 'white',
      borderRadius: '0.25rem',
      border: 'none'
    },
    infoPanel: {
      position: 'absolute',
      bottom: '1rem',
      left: '1rem',
      backgroundColor: 'rgba(17, 24, 39, 0.8)',
      padding: '1rem',
      borderRadius: '0.5rem',
      color: 'white',
      maxWidth: '20rem'
    },
    infoTitle: {
      fontSize: '1.25rem',
      marginBottom: '0.5rem',
      fontWeight: 'bold'
    },
    infoParagraph: {
      marginBottom: '0.5rem'
    }
  };
  
  return (
    <div style={styles.container}>
      {/* キャンバス */}
      <canvas
        ref={canvasRef}
        style={styles.canvas}
      />
      
      {/* 操作ボタン */}
      <div style={styles.controlsContainer}>
        <button
          onClick={() => setShowControls(!showControls)}
          style={styles.controlButton}
          title="設定を表示/非表示"
        >
          ⚙️
        </button>
        
        <button
          onClick={() => setIsDrawing(!isDrawing)}
          style={styles.controlButton}
          title={isDrawing ? "一時停止" : "再開"}
        >
          {isDrawing ? "II" : "▶"}
        </button>
        
        <button
          onClick={initParticles}
          style={styles.controlButton}
          title="リセット"
        >
          🔄
        </button>
        
        <button
          onClick={saveCanvas}
          style={styles.controlButton}
          title="保存"
        >
          💾
        </button>
        
        <button
          onClick={() => setShowInfo(!showInfo)}
          style={styles.controlButton}
          title="情報"
        >
          ℹ️
        </button>
      </div>
      
      {/* 設定パネル */}
      {showControls && (
        <div style={styles.settingsPanel}>
          <h2 style={styles.settingsTitle}>設定</h2>
          
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>パーティクル数: {settings.particleCount}</label>
            <input
              type="range"
              min="10"
              max="300"
              value={settings.particleCount}
              onChange={(e) => handleSettingChange('particleCount', parseInt(e.target.value))}
              style={styles.slider}
            />
          </div>
          
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>パーティクルサイズ: {settings.particleSize}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.particleSize}
              onChange={(e) => handleSettingChange('particleSize', parseInt(e.target.value))}
              style={styles.slider}
            />
          </div>
          
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>スピード: {settings.speed}</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={settings.speed}
              onChange={(e) => handleSettingChange('speed', parseFloat(e.target.value))}
              style={styles.slider}
            />
          </div>
          
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>線の長さ: {settings.lineLength}</label>
            <input
              type="range"
              min="50"
              max="300"
              value={settings.lineLength}
              onChange={(e) => handleSettingChange('lineLength', parseInt(e.target.value))}
              style={styles.slider}
            />
          </div>
          
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>フェード量: {settings.fadeAmount}%</label>
            <input
              type="range"
              min="1"
              max="20"
              value={settings.fadeAmount}
              onChange={(e) => handleSettingChange('fadeAmount', parseInt(e.target.value))}
              style={styles.slider}
            />
          </div>
          
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>カラーモード:</label>
            <select
              value={settings.colorMode}
              onChange={(e) => handleSettingChange('colorMode', e.target.value)}
              style={styles.select}
            >
              <option value="rainbow">レインボー</option>
              <option value="monochrome">モノクローム</option>
              <option value="custom">カスタム</option>
            </select>
          </div>
          
          {(settings.colorMode === 'monochrome' || settings.colorMode === 'custom') && (
            <div style={styles.settingsGroup}>
              <label style={styles.settingLabel}>色相: {settings.baseHue}</label>
              <input
                type="range"
                min="0"
                max="360"
                value={settings.baseHue}
                onChange={(e) => handleSettingChange('baseHue', parseInt(e.target.value))}
                style={styles.slider}
              />
            </div>
          )}
          
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>彩度: {settings.saturation}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.saturation}
              onChange={(e) => handleSettingChange('saturation', parseInt(e.target.value))}
              style={styles.slider}
            />
          </div>
          
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>明度: {settings.brightness}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.brightness}
              onChange={(e) => handleSettingChange('brightness', parseInt(e.target.value))}
              style={styles.slider}
            />
          </div>
        </div>
      )}
      
      {/* 情報パネル */}
      {showInfo && (
        <div style={styles.infoPanel}>
          <h2 style={styles.infoTitle}>ジェネレーティブアート・キャンバス</h2>
          <p style={styles.infoParagraph}>マウスを動かして美しいパターンを作成しましょう。</p>
          <p style={styles.infoParagraph}>右上の設定アイコンでパラメーターを調整できます。</p>
          <p style={styles.infoParagraph}>作品が完成したら保存ボタンでダウンロードできます。</p>
        </div>
      )}
    </div>
  );
};

export default GenerativeArtCanvas;