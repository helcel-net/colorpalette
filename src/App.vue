<template>
  <div class="container">
    <h1>Color Palette Generator</h1>

    <!-- Color Picker/Input -->
    <div class="input-container">
      <label for="color-picker">Select Color (Hex):</label>
      <input
        id="color-picker"
        type="color"
        v-model="selectedColor"
        @input="generatePalette"
      />
      <input
        type="text"
        v-model="selectedColor"
        @input="generatePalette"
        placeholder="Enter Hex (e.g., #FF5733)"
      />
    </div>

    <!-- Sliders for adjusting the color -->
    <div class="sliders">
      <label for="lightness">Adjust MixLevel:</label>
      <input
        id="mixlevel"
        type="range"
        min="0"
        max="75"
        step="0.5"
        value="0"
        v-model="mixlevel"
        @input="generatePalette"
      />
    </div>

    <!-- Display the Color Palette -->
    <div class="palette">
      <h2>Generated Palette</h2>
      <div class="palette-colors">
        <div
          v-for="(color, index) in palette"
          :key="index"
          >
          <div
          :style="{ backgroundColor: color.css }"
          class="color-box"
        >
      {{color.pantone}}</div>
        <div>

          </div>
          </div>
      </div>
    </div>

    <!-- Color Spectrum Visualization -->
     <div class="space">
      <h2>Color Space</h2>

      <div class="palette-colors"><div class="space-colors">
        <canvas ref="space" width="360" height="64"></canvas>
       <svg width="360" height="64" class="space-svg">
        <circle
          v-for="(color, index) in palette"
          :key="index"
          :cx="color.raw[2]"
          :cy="32"
          r="16px"
          :fill="color.css"
          stroke="white"
          stroke-width="2"
        />
      </svg>
      </div></div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';

import {genSVG, genColor, genGray, toCSS, toXYZ, toLCH, toHex, genSmartBaseHues, toPantone, toCMYK} from './palette';

export const throttle = (func, wait) => {
    var lastTime = 0;
    var timeoutId;
    var lastArgs = []

    return function (...args) {
        const now = Date.now();
        lastArgs = args;

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = undefined;
        if (now - lastTime >= wait) {
            lastTime = now;
            func.apply(this, lastArgs);
        } else {
            timeoutId = setTimeout(
                () => {
                    lastTime = Date.now();
                    func.apply(this, lastArgs);
                },
                wait - (now - lastTime)
            );
        }
    };
};



export default {
  name: 'App',
  setup() {
    const selectedColor = ref('#3193F5'); // Default color (Hex)
    const mixlevel = ref(0) // Default slider value
    const palette = ref([])
    const space = ref()

    onMounted(()=>
    {
      let canvas = space.value
      let canvasSize = canvas.getBoundingClientRect()
      let ctx = canvas.getContext('2d')
      let factor = 360/canvasSize.width;
      const [l,c,h] = toLCH(selectedColor.value);
      for (let x = 0; x <= canvasSize.width; x++) {
        ctx.fillStyle = toCSS([[l,c,x*factor]])[0]
        ctx.fillRect(x, 0, 1, canvasSize.height)
      }
    })



    const slowgen = throttle(async (a,b)=>{
      const arr = genColor(a,b,genSmartBaseHues(a));
      let raw = arr
      let css = toCSS(arr)
      let pantone = toPantone(arr)
      let hex = toHex(arr)
      let cmyk = toCMYK(arr)
      palette.value = Array.from({ length: arr.length }, (_, i) => ({
  css: css[i],
  raw: raw[i],
  pantone: pantone[i],
  cmyk: cmyk[i],
}));
    },250)
    // Function to generate a palette of colors
    const generatePalette = () => {
      slowgen(selectedColor.value,parseInt(mixlevel.value)/100.)
    }
    generatePalette();

    return {
      selectedColor,
      mixlevel,
      palette,
      space,
      generatePalette,
      slowgen,

    };
  },
};
</script>

<style scoped>
.container {
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1, h2 {
  text-align: center;
}

.input-container, .sliders, .palette, .space {
  margin-bottom: 20px;
}

.palette-colors {
  display: flex;
  gap:10px;
  justify-content: center;
  position: relative;
}

.color-box {
  width: 64px;
  height: 64px;
  border-radius: 5px;
  text-align: center;
  align-content: center;
  color:black;
}

.space-colors{
  width:360px;
  height:64px
}
.palette-colors>div >canvas{
  position: absolute; z-index: 0;
}
.palette-colors>div >svg{
  position: absolute; z-index: 1;
  overflow:visible;
}

</style>
