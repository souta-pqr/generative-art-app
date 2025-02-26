import React, { useState, useRef, useEffect } from 'react';

const GenerativeArtCanvas = () => {
  // キャンバスの状態管理
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const recordingRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  
  const [isDrawing, setIsDrawing] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showInfo, setShowInfo] = useState(true); // 最初は情報パネルを表示
  const [showTutorial, setShowTutorial] = useState(true); // チュートリアルを表示
  const [tutorialStep, setTutorialStep] = useState(0); // チュートリアルのステップ
  const [currentTheme, setCurrentTheme] = useState('default'); // 現在のテーマ
  const [isRecording, setIsRecording] = useState(false); // 録画状態
  const [presetName, setPresetName] = useState(''); // プリセット名
  const [savedPresets, setSavedPresets] = useState(() => {
    const saved = localStorage.getItem('art-presets');
    return saved ? JSON.parse(saved) : [];
  });
  
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
    particleShape: 'circle', // circle, square, triangle
    gravity: 0, // 重力効果
    turbulence: 0, // 乱流効果
  });
  
  // 予め定義されたテーマ
  const themes = {
    default: {
      particleCount: 100,
      particleSize: 3,
      speed: 2,
      lineLength: 100,
      colorMode: 'rainbow',
      baseHue: 180,
      saturation: 80,
      brightness: 80,
      fadeAmount: 5,
      particleShape: 'circle',
      gravity: 0,
      turbulence: 0,
    },
    cosmos: {
      particleCount: 200,
      particleSize: 2,
      speed: 1,
      lineLength: 150,
      colorMode: 'rainbow',
      baseHue: 240,
      saturation: 70,
      brightness: 90,
      fadeAmount: 2,
      particleShape: 'circle',
      gravity: 0.02,
      turbulence: 0.5,
    },
    fire: {
      particleCount: 150,
      particleSize: 4,
      speed: 3,
      lineLength: 70,
      colorMode: 'monochrome',
      baseHue: 20,
      saturation: 100,
      brightness: 70,
      fadeAmount: 10,
      particleShape: 'triangle',
      gravity: -0.05,
      turbulence: 1.5,
    },
    ocean: {
      particleCount: 120,
      particleSize: 3,
      speed: 1.5,
      lineLength: 120,
      colorMode: 'monochrome',
      baseHue: 200,
      saturation: 80,
      brightness: 60,
      fadeAmount: 3,
      particleShape: 'circle',
      gravity: 0.03,
      turbulence: 0.8,
    },
    matrix: {
      particleCount: 180,
      particleSize: 2,
      speed: 2.5,
      lineLength: 200,
      colorMode: 'monochrome',
      baseHue: 120,
      saturation: 100,
      brightness: 50,
      fadeAmount: 5,
      particleShape: 'square',
      gravity: 0.1,
      turbulence: 0,
    },
  };
  
  // パーティクル配列
  const [particles, setParticles] = useState([]);
  
  // マウス位置と状態
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mousePressed, setMousePressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  
  // チュートリアルのステップ
  const tutorialSteps = [
    "ようこそ！このアプリはマウスの動きで美しいパターンを生み出します。",
    "マウスを動かしてみましょう。パーティクルが反応します。",
    "画面をクリックすると波紋効果が生まれます。試してみてください！",
    "右上の⚙️アイコンで設定パネルを開き、様々なパラメーターを調整できます。",
    "テーマボタンでプリセットを切り替えられます。自分だけの設定も保存可能です。",
    "作品が完成したら💾ボタンで保存、📹ボタンで動画として記録できます。",
    "それでは、クリエイティブな時間をお楽しみください！"
  ];
  
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
        rotation: Math.random() * Math.PI * 2, // 回転用（特に三角形用）
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
    
    // チュートリアル訪問済みかチェック
    const tutorialSeen = localStorage.getItem('tutorial-seen');
    if (tutorialSeen) {
      setShowTutorial(false);
    }
    
    // キーボードショートカットの設定
    const handleKeyPress = (e) => {
      switch(e.key) {
        case ' ': // スペースキーで一時停止/再開
          setIsDrawing(prev => !prev);
          break;
        case 's': // s キーで保存
          saveCanvas();
          break;
        case 'c': // c キーで設定パネル切り替え
          setShowControls(prev => !prev);
          break;
        case 'r': // r キーでリセット
          initParticles();
          break;
        case 'i': // i キーで情報パネル切り替え
          setShowInfo(prev => !prev);
          break;
        case 'v': // v キーで録画開始/停止
          toggleRecording();
          break;
        case '1': case '2': case '3': case '4': case '5':
          // 数字キーでテーマ切り替え
          const themeKeys = Object.keys(themes);
          const index = parseInt(e.key) - 1;
          if (index >= 0 && index < themeKeys.length) {
            applyTheme(themeKeys[index]);
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyPress);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  
  // パラメーター変更時の処理
  useEffect(() => {
    initParticles();
  }, [settings.particleCount, settings.particleSize]);  // eslint-disable-line react-hooks/exhaustive-deps
  
  // マウス操作のイベントハンドラー
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseDown = (e) => {
      setMousePressed(true);
      // 波紋エフェクトを追加
      addRipple(e.clientX, e.clientY);
    };
    
    const handleMouseUp = () => {
      setMousePressed(false);
    };
    
    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        setMousePressed(true);
        setMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        addRipple(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    
    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        setMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    };
    
    const handleTouchEnd = () => {
      setMousePressed(false);
    };
    
    console.log("Adding mouse event listeners"); // デバッグ用
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  
  // 波紋効果の追加
  const addRipple = (x, y) => {
    const newRipple = {
      x,
      y,
      radius: 0,
      maxRadius: settings.lineLength * 1.5,
      opacity: 1,
      color: settings.colorMode === 'rainbow' ? Math.random() * 360 : settings.baseHue
    };
    
    setRipples(prev => [...prev, newRipple]);
  };
  
  // 波紋アニメーションの更新
  const updateRipples = (ctx) => {
    // 新しい波紋配列を作成
    const updatedRipples = ripples.map(ripple => {
      // 波紋を描画
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${ripple.color}, ${settings.saturation}%, ${settings.brightness}%, ${ripple.opacity})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 波紋のパラメータを更新
      return {
        ...ripple,
        radius: ripple.radius + 3,
        opacity: ripple.opacity - 0.02
      };
    }).filter(ripple => ripple.opacity > 0); // 透明になった波紋を削除
    
    setRipples(updatedRipples);
  };
  
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
      
      // 波紋エフェクトの更新
      updateRipples(ctx);
      
      // パーティクルの更新と描画
      const updatedParticles = particles.map(particle => {
        // 位置の更新
        let newX = particle.x + particle.speedX;
        let newY = particle.y + particle.speedY;
        
        // 重力効果（中心に向かって引っ張られる）
        if (settings.gravity !== 0) {
          const centerX = width / 2;
          const centerY = height / 2;
          const dx = centerX - newX;
          const dy = centerY - newY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          particle.speedX += (dx / distance) * settings.gravity;
          particle.speedY += (dy / distance) * settings.gravity;
        }
        
        // 乱流効果（ランダムな動き）
        if (settings.turbulence !== 0) {
          particle.speedX += (Math.random() - 0.5) * settings.turbulence * 0.1;
          particle.speedY += (Math.random() - 0.5) * settings.turbulence * 0.1;
        }
        
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
          
          // マウスからの影響で速度変更（マウスが押されている場合は強く引き寄せる）
          const influence = mousePressed ? 0.002 : 0.0005;
          particle.speedX += dx * influence;
          particle.speedY += dy * influence;
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
        ctx.save();
        ctx.translate(newX, newY);
        
        if (settings.colorMode === 'rainbow') {
          particle.hue = (particle.hue + 0.5) % 360;
          ctx.fillStyle = `hsl(${particle.hue}, ${settings.saturation}%, ${settings.brightness}%)`;
        } else if (settings.colorMode === 'monochrome') {
          ctx.fillStyle = `hsl(${settings.baseHue}, ${settings.saturation}%, ${settings.brightness}%)`;
        } else {
          ctx.fillStyle = `hsl(${settings.baseHue}, ${settings.saturation}%, ${settings.brightness}%)`;
        }
        
        // 形状に応じて描画
        if (settings.particleShape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (settings.particleShape === 'square') {
          ctx.rotate(particle.rotation);
          ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
        } else if (settings.particleShape === 'triangle') {
          ctx.rotate(particle.rotation);
          ctx.beginPath();
          ctx.moveTo(0, -particle.size * 1.5);
          ctx.lineTo(-particle.size, particle.size);
          ctx.lineTo(particle.size, particle.size);
          ctx.closePath();
          ctx.fill();
        }
        
        ctx.restore();
        
        return {
          ...particle,
          x: newX,
          y: newY,
          rotation: particle.rotation + 0.01  // ゆっくり回転させる
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
  }, [isDrawing, particles, settings, mousePos, mousePressed, ripples]);
  
  // 画像の保存機能
  const saveCanvas = () => {
    if (!canvasRef.current) return;
    
    // 保存通知を表示
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 2000);
    
    const link = document.createElement('a');
    link.download = 'generative-art.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };
  
  // 録画機能
  const toggleRecording = () => {
    if (isRecording) {
      // 録画停止
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // 録画開始
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generative-art.webm';
        a.click();
        URL.revokeObjectURL(url);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    }
  };
  
  // 設定の変更ハンドラー
  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // テーマの適用
  const applyTheme = (themeName) => {
    if (themes[themeName]) {
      setSettings(themes[themeName]);
      setCurrentTheme(themeName);
    }
  };
  
  // プリセットの保存
  const savePreset = () => {
    if (presetName.trim() === '') return;
    
    const newPreset = {
      name: presetName,
      settings: { ...settings }
    };
    
    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    localStorage.setItem('art-presets', JSON.stringify(updatedPresets));
    setPresetName('');
  };
  
  // プリセットの適用
  const applyPreset = (preset) => {
    setSettings(preset.settings);
  };
  
  // プリセットの削除
  const deletePreset = (index) => {
    const updatedPresets = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(updatedPresets);
    localStorage.setItem('art-presets', JSON.stringify(updatedPresets));
  };
  
  // チュートリアルを進める
  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      // チュートリアル完了
      setShowTutorial(false);
      localStorage.setItem('tutorial-seen', 'true');
    }
  };
  
  // 通知ステート
  const [saveNotification, setSaveNotification] = useState(false);
  
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
      gap: '0.5rem',
      zIndex: 10
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
      width: '2.5rem',
      height: '2.5rem',
      fontSize: '1.2rem',
      transition: 'transform 0.2s, background-color 0.2s'
    },
    activeButton: {
      backgroundColor: 'rgba(79, 70, 229, 0.8)'
    },
    recordingButton: {
      backgroundColor: 'rgba(220, 38, 38, 0.8)'
    },
    settingsPanel: {
      position: 'absolute',
      top: '4rem',
      right: '1rem',
      backgroundColor: 'rgba(17, 24, 39, 0.8)',
      padding: '1rem',
      borderRadius: '0.5rem',
      color: 'white',
      width: '18rem',
      maxHeight: '80vh',
      overflowY: 'auto',
      zIndex: 10,
      backdropFilter: 'blur(5px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
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
      maxWidth: '20rem',
      zIndex: 10,
      backdropFilter: 'blur(5px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    infoTitle: {
      fontSize: '1.25rem',
      marginBottom: '0.5rem',
      fontWeight: 'bold'
    },
    infoParagraph: {
      marginBottom: '0.5rem'
    },
    themeContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      marginBottom: '1rem'
    },
    themeButton: {
      padding: '0.5rem 0.75rem',
      borderRadius: '0.25rem',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: 'rgba(31, 41, 55, 0.8)',
      color: 'white',
      fontSize: '0.875rem'
    },
    activeThemeButton: {
      backgroundColor: 'rgba(79, 70, 229, 0.8)',
      fontWeight: 'bold'
    },
    presetInput: {
      width: '100%',
      padding: '0.5rem',
      backgroundColor: 'rgba(31, 41, 55, 0.8)',
      color: 'white',
      borderRadius: '0.25rem',
      border: 'none',
      marginBottom: '0.5rem'
    },
    presetButton: {
      padding: '0.5rem',
      backgroundColor: 'rgba(79, 70, 229, 0.8)',
      color: 'white',
      borderRadius: '0.25rem',
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      marginBottom: '1rem'
    },
    presetList: {
      marginTop: '1rem'
    },
    presetItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem',
      backgroundColor: 'rgba(31, 41, 55, 0.8)',
      borderRadius: '0.25rem',
      marginBottom: '0.5rem'
    },
    presetItemName: {
      flexGrow: 1
    },
    presetItemButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      padding: '0.25rem',
      marginLeft: '0.5rem'
    },
    tutorialOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20
    },
    tutorialBox: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      padding: '2rem',
      borderRadius: '0.5rem',
      maxWidth: '30rem',
      textAlign: 'center',
      color: 'white',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    tutorialTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '1rem'
    },
    tutorialText: {
      fontSize: '1.125rem',
      marginBottom: '2rem',
      lineHeight: 1.6
    },
    tutorialButton: {
      padding: '0.75rem 1.5rem',
      backgroundColor: 'rgba(79, 70, 229, 0.8)',
      color: 'white',
      border: 'none',
      borderRadius: '0.25rem',
      fontSize: '1rem',
      cursor: 'pointer'
    },
    notification: {
      position: 'fixed',
      top: '2rem',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(79, 70, 229, 0.9)',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '0.5rem',
      zIndex: 30,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      animation: 'fadeIn 0.3s, fadeOut 0.3s 1.7s',
      backdropFilter: 'blur(5px)'
    },
    keyboardShortcuts: {
      marginTop: '1rem',
      padding: '0.75rem',
      backgroundColor: 'rgba(31, 41, 55, 0.8)',
      borderRadius: '0.25rem'
    },
    shortcutItem: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0.25rem'
    },
    shortcutKey: {
      backgroundColor: 'rgba(55, 65, 81, 0.8)',
      padding: '0.125rem 0.375rem',
      borderRadius: '0.25rem',
      marginRight: '0.5rem'
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
          style={{
            ...styles.controlButton,
            ...(showControls ? styles.activeButton : {})
          }}
          title="設定を表示/非表示 (Cキー)"
        >
          ⚙️
        </button>
        
        <button
          onClick={() => setIsDrawing(!isDrawing)}
          style={styles.controlButton}
          title={isDrawing ? "一時停止 (スペースキー)" : "再開 (スペースキー)"}
        >
          {isDrawing ? "II" : "▶"}
        </button>
        
        <button
          onClick={initParticles}
          style={styles.controlButton}
          title="リセット (Rキー)"
        >
          🔄
        </button>
        
        <button
          onClick={saveCanvas}
          style={styles.controlButton}
          title="保存 (Sキー)"
        >
          💾
        </button>
        
        <button
          onClick={toggleRecording}
          style={{
            ...styles.controlButton,
            ...(isRecording ? styles.recordingButton : {})
          }}
          title={isRecording ? "録画停止 (Vキー)" : "録画開始 (Vキー)"}
        >
          📹
        </button>
        
        <button
          onClick={() => setShowInfo(!showInfo)}
          style={{
            ...styles.controlButton,
            ...(showInfo ? styles.activeButton : {})
          }}
          title="情報を表示/非表示 (Iキー)"
        >
          ℹ️
        </button>
      </div>
      
      {/* 設定パネル */}
      {showControls && (
        <div style={styles.settingsPanel}>
          <h2 style={styles.settingsTitle}>設定</h2>
          
          {/* テーマセレクター */}
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>テーマ:</label>
            <div style={styles.themeContainer}>
              {Object.keys(themes).map((theme) => (
                <button
                  key={theme}
                  onClick={() => applyTheme(theme)}
                  style={{
                    ...styles.themeButton,
                    ...(currentTheme === theme ? styles.activeThemeButton : {})
                  }}
                  title={`${theme}テーマを適用 (${Object.keys(themes).indexOf(theme) + 1}キー)`}
                >
                  {theme === 'default' ? 'デフォルト' : 
                   theme === 'cosmos' ? '宇宙' :
                   theme === 'fire' ? '炎' :
                   theme === 'ocean' ? '海' :
                   theme === 'matrix' ? 'マトリックス' : theme}
                </button>
              ))}
            </div>
          </div>
          
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
          
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>パーティクル形状:</label>
            <select
              value={settings.particleShape}
              onChange={(e) => handleSettingChange('particleShape', e.target.value)}
              style={styles.select}
            >
              <option value="circle">円形</option>
              <option value="square">四角形</option>
              <option value="triangle">三角形</option>
            </select>
          </div>
          
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>重力: {settings.gravity}</label>
            <input
              type="range"
              min="-0.1"
              max="0.1"
              step="0.01"
              value={settings.gravity}
              onChange={(e) => handleSettingChange('gravity', parseFloat(e.target.value))}
              style={styles.slider}
            />
          </div>
          
          <div style={styles.settingsGroup}>
            <label style={styles.settingLabel}>乱流: {settings.turbulence}</label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={settings.turbulence}
              onChange={(e) => handleSettingChange('turbulence', parseFloat(e.target.value))}
              style={styles.slider}
            />
          </div>
          
          {/* プリセット保存 */}
          <div style={styles.settingsGroup}>
            <h3 style={{...styles.settingsTitle, fontSize: '1rem'}}>プリセット保存</h3>
            <input
              type="text"
              placeholder="プリセット名を入力"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              style={styles.presetInput}
            />
            <button
              onClick={savePreset}
              style={styles.presetButton}
            >
              現在の設定を保存
            </button>
          </div>
          
          {/* 保存したプリセット一覧 */}
          {savedPresets.length > 0 && (
            <div style={styles.presetList}>
              <h3 style={{...styles.settingsTitle, fontSize: '1rem'}}>保存したプリセット</h3>
              {savedPresets.map((preset, index) => (
                <div key={index} style={styles.presetItem}>
                  <span style={styles.presetItemName}>{preset.name}</span>
                  <button
                    onClick={() => applyPreset(preset)}
                    style={styles.presetItemButton}
                    title="適用"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => deletePreset(index)}
                    style={styles.presetItemButton}
                    title="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* キーボードショートカット */}
          <div style={styles.keyboardShortcuts}>
            <h3 style={{...styles.settingsTitle, fontSize: '1rem', marginBottom: '0.5rem'}}>キーボードショートカット</h3>
            <div style={styles.shortcutItem}>
              <span><span style={styles.shortcutKey}>スペース</span>再生/一時停止</span>
            </div>
            <div style={styles.shortcutItem}>
              <span><span style={styles.shortcutKey}>S</span>保存</span>
            </div>
            <div style={styles.shortcutItem}>
              <span><span style={styles.shortcutKey}>V</span>録画開始/停止</span>
            </div>
            <div style={styles.shortcutItem}>
              <span><span style={styles.shortcutKey}>R</span>リセット</span>
            </div>
            <div style={styles.shortcutItem}>
              <span><span style={styles.shortcutKey}>C</span>設定パネル</span>
            </div>
            <div style={styles.shortcutItem}>
              <span><span style={styles.shortcutKey}>I</span>情報パネル</span>
            </div>
            <div style={styles.shortcutItem}>
              <span><span style={styles.shortcutKey}>1-5</span>テーマ切替</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 情報パネル */}
      {showInfo && (
        <div style={styles.infoPanel}>
          <h2 style={styles.infoTitle}>ジェネレーティブアート・キャンバス</h2>
          <p style={styles.infoParagraph}>マウスを動かして美しいパターンを作成しましょう。</p>
          <p style={styles.infoParagraph}><strong>クリック</strong>すると波紋が広がります。</p>
          <p style={styles.infoParagraph}>右上の<strong>⚙️</strong>アイコンでパラメーターを調整できます。</p>
          <p style={styles.infoParagraph}>様々な<strong>テーマ</strong>を試して、お気に入りの設定を<strong>保存</strong>できます。</p>
          <p style={styles.infoParagraph}>作品が完成したら<strong>💾</strong>ボタンで保存、<strong>📹</strong>ボタンで動画として記録できます。</p>
          <p style={styles.infoParagraph}>
            <button 
              onClick={() => { setShowTutorial(true); setTutorialStep(0); }}
              style={{...styles.themeButton, backgroundColor: 'rgba(79, 70, 229, 0.8)'}}
            >
              チュートリアルを表示
            </button>
          </p>
        </div>
      )}
      
      {/* チュートリアルオーバーレイ */}
      {showTutorial && (
        <div style={styles.tutorialOverlay}>
          <div style={styles.tutorialBox}>
            <h2 style={styles.tutorialTitle}>
              {tutorialStep === 0 ? "ようこそ！" : `ステップ ${tutorialStep}/${tutorialSteps.length - 1}`}
            </h2>
            <p style={styles.tutorialText}>{tutorialSteps[tutorialStep]}</p>
            <button 
              onClick={nextTutorialStep}
              style={styles.tutorialButton}
            >
              {tutorialStep < tutorialSteps.length - 1 ? "次へ" : "始める"}
            </button>
          </div>
        </div>
      )}
      
      {/* 保存通知 */}
      {saveNotification && (
        <div style={styles.notification}>
          画像を保存しました！
        </div>
      )}
    </div>
  );
};

export default GenerativeArtCanvas;