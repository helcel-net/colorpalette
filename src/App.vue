<template>
  <div class="section">
  <div class="container">

    <div class="col-12 row">
      <div class="col-2">
        <div class="input col-12">
          <div class="input row">
            <input
              id="color-picker"
              class="col-3"
              type="color"
              style="height:48px"
              v-model="selectedColor"
              @input="generatePalette"
            />
            <input
              type="text"
              class="col-9"
              v-model="selectedColor"
              @input="generatePalette"
              placeholder="Enter Hex (e.g., #FF5733)"
            />
          </div>
        
          <div class="input row">
            <label for="lightness" class="col-2">Mix</label>
            <input
              id="mixlevel"
              class="col-10"
              type="range"
              min="0"
              max="75"
              step="0.5"
              value="0"
              v-model="mixlevel"
              @input="generatePalette"
            />
          </div>
          <div class="checkbox row">
            <label for="contrast" class="col-6">Contrast</label>
            <input
              id="contrast"
              class="col-2"
              type="checkbox"
              min="0"
              max="75"
              step="0.5"
              value="0"
              v-model="showContrast"
            />
          </div>
        </div>
      </div>
    
    <!-- Display the Color Palette -->
    <div class="col-10">
      <div class="col-12 ">
      <h1 class="text-huge text-white text-center">Color Palette Generator</h1></div>
      <div class="space align row">
        <div class="space-colors">
          <canvas ref="space" class="rounded" width="360" height="64"></canvas>
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
        </div>
      </div>

        <div class="palette-colors col-12 row">
          <div
            v-for="(color, index) in palette"
            :key="index"
            class="col-3 rounded"
            style="aspect-ratio:1/1" >
            <div
            :style="{ backgroundColor: color.css, gap:'5%', padding:'5%', 'align-content':'center' }"
            class="w-100 h-100 flex">  
              <span  v-if="showContrast"
            v-for="(colorb, indexb) in palette"
            :key="index" class="ratio-1 rounded" :style="{
              background: colorb.css, 
              width:'10%', height:'16px', display:'block', 
              display:index==indexb?'none':'block',
              'border':Math.abs(contrast(colorb.raw,color.raw))<5?'solid 1px white':'none'
            }">{{contrast(colorb.raw,color.raw)}}</span>
              </div>
            <div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';

import {genSVG, genColor, genGray, toCSS, toXYZ, toLCH, toHex, genSmartBaseHues, toPantone, toCMYK, contrast} from './palette';

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
    const showContrast = ref(false)

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
      contrast,
      showContrast,

    };
  },
};
</script>

<style scoped>
.space-colors{
  width:360px;
  height:64px
}
.space-colors >canvas{
  position: absolute; z-index: 0;
}
.space-colors >svg{
  position: absolute; z-index: 1;
  overflow:visible;
}
.palette-pin {
  width: 16px;
  height: 16px;
}

</style>
