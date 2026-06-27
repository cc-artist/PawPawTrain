import React, { useState, useEffect } from 'react';

const Pet3D = ({ petType, onPet, postCount = 0, isResetting = false, imageUrl = null }) => {
  const [isPetting, setIsPetting] = useState(false);
  const [showRollAnimation, setShowRollAnimation] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    if (isResetting) {
      setShowRollAnimation(true);
      const timer = setTimeout(() => {
        setShowRollAnimation(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isResetting]);

  const handleClick = () => {
    if (!isResetting && !showRollAnimation) {
      setIsPetting(true);
      onPet?.();
      setTimeout(() => setIsPetting(false), 500);
    }
  };

  const getGrowthStage = () => {
    if (postCount >= 15) return 'stage3';
    if (postCount >= 5) return 'stage2';
    return 'stage1';
  };

  const getStageStyle = () => {
    const stage = getGrowthStage();
    switch (stage) {
      case 'stage1':
        return {
          fontSize: '120px',
          glowColor: 'rgba(139, 92, 246, 0.6)',
          borderColor: 'rgba(139, 92, 246, 0.8)',
          bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
          shadow: '0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(236, 72, 153, 0.3)',
          bodyColor: 'from-purple-400 to-pink-400'
        };
      case 'stage2':
        return {
          fontSize: '140px',
          glowColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 0.9)',
          bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(16, 185, 129, 0.3))',
          shadow: '0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(16, 185, 129, 0.4)',
          bodyColor: 'from-blue-400 to-emerald-400'
        };
      case 'stage3':
        return {
          fontSize: '160px',
          glowColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(251, 191, 36, 0.4))',
          shadow: '0 0 50px rgba(239, 68, 68, 0.7), 0 0 100px rgba(251, 191, 36, 0.5)',
          bodyColor: 'from-red-400 to-amber-400'
        };
      default:
        return {
          fontSize: '120px',
          glowColor: 'rgba(139, 92, 246, 0.6)',
          borderColor: 'rgba(139, 92, 246, 0.8)',
          bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
          shadow: '0 0 30px rgba(139, 92, 246, 0.5)',
          bodyColor: 'from-purple-400 to-pink-400'
        };
    }
  };

  const getStageEmoji = () => {
    const stage = getGrowthStage();
    switch (petType) {
      case 'dog':
        if (stage === 'stage1') return '🐕';
        if (stage === 'stage2') return '🐕‍🦺';
        return '🐩';
      case 'rabbit':
        if (stage === 'stage1') return '🐰';
        if (stage === 'stage2') return '🐇';
        return '🐇';
      case 'cat':
      default:
        if (stage === 'stage1') return '🐱';
        if (stage === 'stage2') return '😺';
        return '😻';
    }
  };

  const isEmptyState = postCount === 0 || isResetting;
  const style = getStageStyle();

  const pulseDotStyle = (delay) => ({
    animation: `pulse-dot 1.5s ease-in-out infinite`,
    animationDelay: `${delay}s`
  });

  const pulseGlowStyle = (delay) => ({
    animation: `pulse-glow-dot 1.5s ease-in-out infinite`,
    animationDelay: `${delay}s`
  });

  return (
    <div 
      className="w-full h-full flex items-center justify-center cursor-pointer"
      onClick={handleClick}
    >
      {isEmptyState ? (
        <div 
          className="relative select-none"
          style={{
            animation: showRollAnimation ? 'roll 0.5s ease-in-out 6' : 'float 3s ease-in-out infinite',
          }}
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 opacity-30 blur-xl rounded-full"
            style={{
              width: '200px',
              height: '200px',
              transform: 'translate(-25%, -25%)',
              animation: 'pulse-glow-white 2s ease-in-out infinite'
            }}
          />
          
          <div
            className="relative rounded-full border-4"
            style={{
              width: '180px',
              height: '180px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.9))',
              borderColor: 'rgba(200, 200, 200, 0.6)',
              boxShadow: '0 0 30px rgba(255, 255, 255, 0.4), 0 0 60px rgba(220, 220, 220, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              animation: showRollAnimation ? 'roll 0.5s ease-in-out 6' : 'float 3s ease-in-out infinite',
              transform: isPetting ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease'
            }}
          >
            <div className="absolute inset-2 rounded-full border-2 border-gray-200/50" />
            <div className="absolute inset-4 rounded-full border border-gray-100/30" />
            
            <div 
              className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-white"
              style={{ 
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.9)',
                ...pulseGlowStyle(0)
              }}
            />
            <div 
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gray-100"
              style={{ 
                boxShadow: '0 0 8px rgba(230, 230, 230, 0.8)',
                ...pulseGlowStyle(0.5)
              }}
            />
            <div 
              className="absolute -bottom-2 -left-1 w-3 h-3 rounded-full bg-gray-200"
              style={{ 
                boxShadow: '0 0 8px rgba(200, 200, 200, 0.8)',
                ...pulseGlowStyle(1)
              }}
            />
            <div 
              className="absolute -bottom-1 -right-2 w-4 h-4 rounded-full bg-gray-300"
              style={{ 
                boxShadow: '0 0 10px rgba(180, 180, 180, 0.8)',
                ...pulseGlowStyle(1.5)
              }}
            />

            {showRollAnimation && (
              <div 
                className="transition-transform duration-200"
                style={{
                  fontSize: '120px',
                  animation: 'roll-emoji 0.5s ease-in-out 6'
                }}
              >
                🙀
              </div>
            )}

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gray-300"
                  style={{
                    boxShadow: '0 0 5px rgba(200, 200, 200, 0.8)',
                    ...pulseDotStyle(i * 0.3)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="relative select-none"
          style={{
            animation: showRollAnimation ? 'roll 0.5s ease-in-out 6' : 'float 3s ease-in-out infinite',
          }}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${style.bodyColor} opacity-30 blur-xl rounded-full`}
            style={{
              width: '200px',
              height: '200px',
              transform: 'translate(-25%, -25%)',
              animation: 'pulse-glow 2s ease-in-out infinite'
            }}
          />
          
          <div
            className="relative rounded-full border-4"
            style={{
              width: '180px',
              height: '180px',
              backgroundColor: style.bgGradient,
              borderColor: style.borderColor,
              boxShadow: style.shadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              animation: showRollAnimation ? 'roll 0.5s ease-in-out 6' : 'float 3s ease-in-out infinite',
              transform: isPetting ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease'
            }}
          >
            <div className="absolute inset-2 rounded-full border-2 border-white/20" />
            <div className="absolute inset-4 rounded-full border border-white/10" />
            
            <div 
              className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-cyan-400"
              style={{ 
                boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)',
                ...pulseGlowStyle(0)
              }}
            />
            <div 
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-pink-400"
              style={{ 
                boxShadow: '0 0 8px rgba(236, 72, 153, 0.8)',
                ...pulseGlowStyle(0.5)
              }}
            />
            <div 
              className="absolute -bottom-2 -left-1 w-3 h-3 rounded-full bg-yellow-400"
              style={{ 
                boxShadow: '0 0 8px rgba(250, 204, 21, 0.8)',
                ...pulseGlowStyle(1)
              }}
            />
            <div 
              className="absolute -bottom-1 -right-2 w-4 h-4 rounded-full bg-green-400"
              style={{ 
                boxShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
                ...pulseGlowStyle(1.5)
              }}
            />

            <div 
              className="transition-transform duration-200 flex items-center justify-center"
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                overflow: 'hidden',
                animation: showRollAnimation ? 'roll-emoji 0.5s ease-in-out 6' : 'bounce-subtle 2s ease-in-out infinite'
              }}
            >
              {showRollAnimation ? (
                <span style={{ fontSize: style.fontSize, filter: `drop-shadow(0 0 10px ${style.glowColor})` }}>🙀</span>
              ) : imageUrl && !imageLoadError ? (
                <img 
                  src={imageUrl}
                  alt="Pet"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '50%' }}
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                <span style={{ fontSize: style.fontSize, filter: `drop-shadow(0 0 10px ${style.glowColor})` }}>{getStageEmoji()}</span>
              )}
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${getGrowthStage() === 'stage3' ? 'bg-red-400' : getGrowthStage() === 'stage2' ? 'bg-blue-400' : 'bg-purple-400'}`}
                  style={{
                    boxShadow: `0 0 5px ${style.glowColor}`,
                    ...pulseDotStyle(i * 0.3)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(2deg); }
          50% { transform: translateY(-15px) rotate(0deg); }
          75% { transform: translateY(-10px) rotate(-2deg); }
        }
        
        @keyframes roll {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes roll-emoji {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(90deg); }
          50% { transform: scale(1) rotate(180deg); }
          75% { transform: scale(0.8) rotate(270deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: translate(-25%, -25%) scale(1); }
          50% { opacity: 0.5; transform: translate(-25%, -25%) scale(1.1); }
        }
        
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes pulse-glow-dot {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes pulse-glow-white {
          0%, 100% { opacity: 0.5; transform: translate(-25%, -25%) scale(1); }
          50% { opacity: 0.7; transform: translate(-25%, -25%) scale(1.1); }
        }

        @keyframes pulse-dot-white {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}} />
    </div>
  );
};

export default Pet3D;
