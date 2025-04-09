<template>
  <div class="section">
      <div class="col-2 fleft p-abs" style="z-index: 100;">
        <div class="input col-12">
          <div class="input row">
            <input
              id="color-picker"
              class="col-3"
              type="color"
              style="height:32px"
              v-model="selectedColor"
              @input="generatePalette"
            />
            <input
              type="text"
              class="col-9"
              v-model="selectedColor"
              @input="generatePalette"
            />
          </div>
        </div>

         <div class="rounded bg-white col-12">
            <div class="checkbox">
              <input
                id="bw"
                type="checkbox"
                v-model="selectedBW"
                @change="generatePalette"
              />
              <label for="bw">BW/Colour</label>
          </div>
        </div>

        <div v-if="selectedBW" class="input rounded bg-white col-12">
              <label class="col-2" for="mixlevel">Mix</label>
              <input
              id="mixlevel"
              class="col-11"
              type="range"
              min="0"
              max="100"
              step="0.5"
              value="0"
              v-model="mixlevel"
              @input="generatePalette"
            />
              <label class="col-2"  for="over">Pastellify</label>
              <input
              id="over"
              class="col-11"
              type="range"
              min="-1"
              max="4"
              step="0.5"
              value="0"
              v-model="selectedPastellify"
              @input="generatePalette"
            />
        </div>        
        <div v-else="selectedBW" class="rounded bg-white col-12">
            <div class="checkbox">
              <input
                id="complement"
                type="checkbox"
                v-model="selectedComplementary"
                @change="generatePalette"
              />
              <label for="complement">Complementary</label>
          </div>
        </div>

        <div class="rounded bg-white col-12">
          <div v-for="mode in modes" :key="mode">
            <div v-if="mode==null" style="height:1px;background-color: darkgray;"></div>
            <div v-else class="radio">
              <input
                :id="'c'+mode"
                type="radio"
                v-model="selectedMode"
                :value="mode"
              />
              <label  :for="'c'+mode">{{ mode }}</label>
            </div>
          </div>
        </div>
      </div>

  <div class="col-12 container align row">
    <div class="col-8">
      <div class="col-12">
      <h1 class="text-huge text-white text-center">Color Palette Generator</h1>
      </div>
      <div class="align row">
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

      <div class="align col-12 row">
        <div
          v-for="(color, index) in palette"
          :key="index"
          class="col-3 rounded"
          style="aspect-ratio:1/1" >
          <div
          :style="{ backgroundColor: color.css, gap:'5%', padding:'5%', 'align-content':'center' }"
          class="w-100 h-100 flex rounded">  
            <span  v-if="selectedMode=='Contrast'"
              v-for="(colorb, indexb) in palette"
              :key="'c'+indexb" class="ratio-1 rounded" :style="{
                background: colorb.css, 
                width:'10%', height:'16px', display:'block', 
                display:index==indexb?'none':'block',
                'border':Math.abs(contrast(colorb.raw,color.raw))<5?'solid 1px white':'none'
              }"></span>
          <span  v-else-if="selectedMode=='Difference'"
              v-for="(colorb, indexb) in palette"
              :key="'d'+indexb" class="ratio-1 rounded" :style="{
                background: colorb.css, 
                width:'10%', height:'16px', display:'block', 
                display:index==indexb?'none':'block',
                'border':Math.abs(difference(colorb.raw,color.raw))<10?'solid 1px white':'none'
              }"></span>
          <span  v-else-if="selectedMode=='LCH'">{{color.css }}</span>
          <span  v-else-if="selectedMode=='CMYK'">{{color.cmyk.map(v=>Math.round(v*100)/100) }}</span>
          <span  v-else-if="selectedMode=='Hex'">{{color.hex }}</span>
          <span  v-else-if="selectedMode=='Pantone'">{{color.pantone }}</span>
            </div>
          <div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';

import {genSVG, genColor, genGray, toCSS, toXYZ, toLCH, toHex, genSmartBaseHues, toPantone, toCMYK, contrast, difference} from './palette';

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
    const selectedColor = ref('#3193F5');
    const mixlevel = ref(0)
    const palette = ref([])
    const space = ref()
    const modes = ['Hex','CMYK', 'LCH', 'Pantone',null,'Contrast', 'Difference','None']
    const selectedMode = ref('none')
    const selectedBW = ref(true)
    const selectedComplementary = ref(false)
    const modesPastellify = 8;
    const selectedPastellify = ref(0)
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



    const slowgen = throttle((a,b, bw, comp, over)=>{
      console.log(over)
      let arr = []
      if(bw){
        arr = genColor(a,b,genSmartBaseHues(a),over);
      }else{
        arr = genGray(a,comp);
      }
      let raw = arr
      let css = toCSS(arr)
      let pantone = toPantone(arr)
      let hex = toHex(arr)
      let cmyk = toCMYK(arr)
      palette.value = Array.from({ length: arr.length }, (_, i) => ({
  css: css[i],
  raw: raw[i],
  pantone: pantone[i],
  hex: hex[i],
  cmyk: cmyk[i],
}));
    },250)
    // Function to generate a palette of colors
    const generatePalette = () => {
      slowgen(selectedColor.value,parseInt(mixlevel.value)/100., selectedBW.value, selectedComplementary.value, selectedPastellify.value)
    }
    generatePalette();

    return {
      selectedColor,
      mixlevel,
      palette,
      space,
      generatePalette,
      slowgen,
      contrast,difference,
      modes,
      selectedMode,
      selectedBW,
      selectedComplementary,
      selectedPastellify

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
