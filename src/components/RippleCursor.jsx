import { useReducer, useEffect } from 'react';
import './RippleCursor.css';

const rippleReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_RIPPLE':
      return [...state, action.payload].slice(-30);
    case 'REMOVE_RIPPLE':
      return state.filter((ripple) => ripple.id !== action.payload);
    default:
      return state;
  }
};

const RippleCursor = ({ maxSize = 50, duration = 1000, blur = true }) => {
  const [ripples, dispatch] = useReducer(rippleReducer, []);

  const handleMouseMove = (e) => {
    const ripple = {
      id: `${Date.now()}-${Math.random()}`,
      x: e.clientX,
      y: e.clientY,
    };
    dispatch({ type: 'ADD_RIPPLE', payload: ripple });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_RIPPLE', payload: ripple.id });
    }, duration);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [duration]);

  return (
    <div className="ripple-cursor-container">
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="ripple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${maxSize}px`,
            height: `${maxSize}px`,
            animationDuration: `${duration}ms`,
            filter: blur ? 'blur(4px)' : 'none',
          }}
        />
      ))}
    </div>
  );
};

export default RippleCursor;
