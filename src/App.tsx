import {
  Canvas,
  Image as SkiaImage,
  useImage,
} from "@shopify/react-native-skia";

import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Pressable, StyleSheet } from "react-native";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
  runOnJS,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import useUpdate from "./hooks/useUpdate";
import { Audio } from "expo-av";
import { Sound } from "expo-av/build/Audio";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

const height = Dimensions.get("window").height;
const width = Dimensions.get("window").width;

const BIRD_SIZE = 70;

export default function App() {
  const [isReady, setIsReady] = useState(false);

  const [flapSound, setFlapSound] = useState<Sound>();
  const [dieSound, setDieSound] = useState<Sound>();

  const loadSound = async () => {
    const { sound: flap } = await Audio.Sound.createAsync(
      require("./assets/SoundEffects/wing.wav")
    );
    const { sound: die } = await Audio.Sound.createAsync(
      require("./assets/SoundEffects/hit.wav")
    );
    setFlapSound(flap);
    setDieSound(die);
  };

  useEffect(() => {
    loadSound().then(() => setIsReady(true));
  }, []);

  const { update } = useUpdate();

  const spriteFrames = [
    useImage(require("./assets/GameObjects/yellowbird-downflap.png")),
    useImage(require("./assets/GameObjects/yellowbird-midflap.png")),
    useImage(require("./assets/GameObjects/yellowbird-upflap.png")),
  ];
  const backgroundImage = useImage(
    require("./assets/GameObjects/background-day.png")
  );
  const baseImage = useImage(require("./assets/GameObjects/base.png"));
  const pipeImage = useImage(require("./assets/GameObjects/pipe-green.png"));
  const pipeTopImage = useImage(
    require("./assets/GameObjects/pipe-green-top.png")
  );

  const yPosition = useSharedValue<number>(0);
  const yVelocity = useSharedValue<number>(0);
  const pipes = useSharedValue<number[]>([]);
  const baseDisplacement = useSharedValue<number>(0);
  const isGameOver = useSharedValue<boolean>(false);
  const frameIndex = useSharedValue<number>(0);
  const frameCount = spriteFrames.length;

  const playDeathSound = () => {
    Alert.alert("Game Over", "", [
      {
        text: "Retry",
        onPress: () => {
          isGameOver.value = false;
          yPosition.value = 0;
          yVelocity.value = 0;
          baseDisplacement.value = 0;
          frameIndex.value = 0;
        },
      },
    ]);
    dieSound?.replayAsync();
  };

  // gameLoop
  useFrameCallback((frameInfo) => {
    if (!isReady) return;

    if (yPosition.value < height - BIRD_SIZE / 2 - yVelocity.value - 112) {
      yPosition.value = yPosition.value + yVelocity.value;
      yVelocity.value = yVelocity.value + 0.12;

      const timeElapsed = Math.floor(frameInfo.timestamp / 100) % frameCount;
      frameIndex.value = timeElapsed;
      if (baseDisplacement.value > -width) {
        baseDisplacement.value = baseDisplacement.value - 2;
      } else {
        baseDisplacement.value = 0;
      }
    } else {
      // if (!isGameOver.value) {
      //   runOnJS(playDeathSound)();
      // }
      // isGameOver.value = true;
    }

    // run update
    runOnJS(update)(frameInfo.timestamp);
  });

  if (!isReady) <></>;

  return (
    <Pressable
      onPress={() => {
        if (isGameOver.value) return;
        yVelocity.value = -5;
        flapSound?.replayAsync();
      }}
    >
      <Canvas style={styles.container}>
        <SkiaImage
          image={backgroundImage}
          x={baseDisplacement.value}
          y={0}
          fit={"fill"}
          width={width}
          height={height}
        />
        <SkiaImage
          image={backgroundImage}
          x={baseDisplacement.value + width}
          y={0}
          fit={"fill"}
          width={width}
          height={height}
        />

        <SkiaImage
          image={pipeTopImage}
          x={baseDisplacement.value + width - 70}
          y={300 - height}
          fit={"fill"}
          width={70}
          height={height}
        />
        <SkiaImage
          image={pipeImage}
          x={baseDisplacement.value + width - 70}
          y={height - 300}
          fit={"fill"}
          width={70}
          height={height}
        />

        <SkiaImage
          image={baseImage}
          x={baseDisplacement.value + width}
          y={height - 112}
          fit={"fill"}
          width={width}
          height={112}
        />
        <SkiaImage
          image={baseImage}
          x={baseDisplacement.value}
          y={height - 112}
          fit={"fill"}
          width={width}
          height={112}
        />
        {spriteFrames[frameIndex.value] && (
          <SkiaImage
            image={spriteFrames[frameIndex.value]}
            x={width / 2 - BIRD_SIZE / 2}
            y={yPosition.value}
            width={BIRD_SIZE}
            height={BIRD_SIZE}
          />
        )}
      </Canvas>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: height,
    width: width,
    alignItems: "center",
    backgroundColor: "#fff990",
  },
  alert: {
    height: 300,
    width: 300,
    top: "25%",
    // bottom: "50%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  dot: {
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    // borderRadius: 30,
    // backgroundColor: "#b58df1",
    position: "absolute",
  },
});
