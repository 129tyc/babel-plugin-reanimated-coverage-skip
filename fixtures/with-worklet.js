import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';

// Normal function - should be covered
function normalFunction() {
  console.log('This is a normal function');
  return 42;
}

// Worklet function with directive - should be skipped
function animationWorklet() {
  'worklet';
  return Math.random() * 100;
}

// Function using Reanimated APIs - should be skipped
function useAnimatedStyleFunction() {
  const opacity = useSharedValue(1);
  
  return useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: withTiming(opacity.value, { duration: 1000 })
    };
  });
}

// Arrow function worklet - should be skipped
const gestureHandler = () => {
  'worklet';
  runOnJS(() => {
    console.log('Gesture handled');
  });
};

// Function with worklet naming pattern - should be skipped
function myCustomWorklet() {
  return 'worklet data';
}

// Hook that might contain worklet - should be skipped
function useAnimatedGesture() {
  const scale = useSharedValue(1);
  
  return {
    onStart: () => {
      'worklet';
      scale.value = withTiming(1.2);
    },
    onEnd: () => {
      'worklet';
      scale.value = withTiming(1);
    }
  };
}
