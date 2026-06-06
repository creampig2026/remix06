/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ParticleCake, BackgroundStars } from './ParticleCake';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState<'welcome' | 'cake' | 'wish'>('welcome');
  const [isBlown, setIsBlown] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (step === 'cake' && !isBlown) {
      const startMicrophone = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
          microphoneRef.current.connect(analyserRef.current);
          
          analyserRef.current.fftSize = 256;
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkAudioLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;

            // Threshold for detecting blowing (might need adjustment depending on mic)
            if (average > 80) {
              setIsBlown(true);
            } else {
              animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
            }
          };

          checkAudioLevel();
        } catch (err) {
          console.error('Error accessing microphone:', err);
        }
      };
      
      startMicrophone();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (microphoneRef.current) {
        microphoneRef.current.mediaStream.getTracks().forEach(track => track.stop());
        microphoneRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [step, isBlown]);

  return (
    <div className="w-full h-screen bg-[#050b14] overflow-hidden font-sans text-white relative">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-auto bg-[#050b14]"
          >
            <h1 className="text-4xl sm:text-6xl mb-12 text-center text-white [text-shadow:0_0_20px_#3399ff,0_0_40px_#3399ff]" style={{ fontFamily: 'Brush Script MT, "Great Vibes", cursive' }}>
              每一岁，都珍贵
            </h1>
            <button
              onClick={() => setStep('cake')}
              className="bg-white text-black px-8 py-3 rounded-full font-bold tracking-widest hover:bg-gray-200 transition-colors uppercase text-sm"
            >
              进入许愿
            </button>
          </motion.div>
        )}

        {step === 'wish' && (
          <motion.div
            key="wish"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6 pointer-events-auto"
          >
            <div className="border border-blue-500/30 bg-blue-900/20 backdrop-blur-md rounded-[2rem] p-8 sm:p-12 text-center max-w-sm w-full mx-auto relative overflow-hidden shadow-2xl shadow-blue-900/50">
               <div className="absolute inset-0 border-2 border-blue-400 rounded-[2rem] opacity-20 pointer-events-none"></div>
               <h2 className="text-4xl sm:text-5xl text-blue-300 mb-6" style={{ fontFamily: 'Brush Script MT, "Great Vibes", cursive' }}>
                 生日快乐,<br/>王一怡
               </h2>
               <p className="text-blue-100/90 mb-8 leading-relaxed font-light">
                 公主请发财
               </p>
               <button
                 onClick={() => {
                   setIsBlown(false);
                   setStep('cake');
                 }}
                 className="bg-[#1e3a8a] text-blue-100 px-6 py-4 rounded-full font-bold tracking-wider hover:bg-blue-800 transition-colors text-sm w-full shadow-lg shadow-blue-500/20"
               >
                 再次许愿
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-0">
        {(step === 'cake' || step === 'wish') && (
          <Canvas camera={{ position: [0, 1.5, 12], fov: 60 }} dpr={[1, 2]}>
             <ambientLight intensity={0.5} />
             <ParticleCake
                isBlown={isBlown}
                onBlownComplete={() => {
                  setTimeout(() => setStep('wish'), 2500);
                }}
             />
             <BackgroundStars />
          </Canvas>
        )}
      </div>

      {step === 'cake' && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
          <AnimatePresence>
            {!isBlown && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                className="w-full text-center mt-8"
              >
                <h2 className="text-5xl sm:text-6xl text-blue-100 mb-4" style={{ fontFamily: 'Brush Script MT, "Great Vibes", cursive' }}>生日快乐</h2>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[1px] w-12 bg-blue-400/50"></div>
                  <p className="tracking-[0.4em] text-blue-300 text-sm uppercase">王欣怡</p>
                  <div className="h-[1px] w-12 bg-blue-400/50"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isBlown && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                className="w-full flex justify-center mb-8 pointer-events-auto"
              >
                <button
                  onClick={() => setIsBlown(true)}
                  className="bg-blue-950/60 backdrop-blur-md border border-blue-500/40 text-blue-200 px-8 py-4 rounded-full font-bold tracking-widest hover:bg-blue-900/80 transition-all active:scale-95 shadow-lg shadow-blue-900/50 flex items-center justify-center"
                >
                  吹蜡烛许愿
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
