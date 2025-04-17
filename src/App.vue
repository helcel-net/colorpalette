<template>
  <div class="section flex">
    <div class="col-6 col-sm-4 col-md-3" style="z-index: 100;">
      <div class="input col-12 ">
        <div class="input row">
          <input
          id="color-picker"
          class="col-3"
          type="color"
          style="height:32px"
          v-model="data.base"
          @input="generatePalette"
          />
          <input
          type="text"
          class="col-9"
          v-model="data.base"
          @input="generatePalette"
          />
        </div>
      </div>
      
      <div class="rounded bg-white col-12">
        <div class="checkbox">
          <input
          id="bw"
          type="checkbox"
          v-model="data.bw"
          @change="generatePalette"
          />
          <label for="bw">BW/Colour</label>
        </div>
      </div>
      
      <div v-if="data.bw" class="input rounded bg-white col-12">
        <label class="col-12" for="hueMode">Palette Mode</label>
        <input
        id="hueMode"
        class="col-12"
        type="range"
        min="0"
        max="3"
        step="1"
        v-model="data.H.mode"
        @input="generatePalette"
        />
        <label class="col-12" for="mixlevel">Mix</label>
        <input
        id="mixlevel"
        class="col-12"
        type="range"
        min="0"
        max="100"
        step="0.5"
        v-model="data.H.mix"
        @input="generatePalette"
        />
        <label class="col-12"  for="over">Pastellify</label>
        <input
        id="over"
        class="col-12"
        type="range"
        :min="data.LC.pastellifyRange[0]"
        :max="data.LC.pastellifyRange[1]"
        step="0.5"
        v-model="data.LC.pastellify"
        @input="generatePalette"
        />
      </div>        
      <div v-else class="rounded bg-white col-12">
        <div class="checkbox">
          <input
          id="complement"
          type="checkbox"
          v-model="data.H.complementary"
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
      
      <div class="input rounded bg-white col-12">
        <div v-for="mode in modesBlind" :key="mode">
          <div v-if="mode==null" style="height:1px;background-color: darkgray;"></div>
          <div v-else class="radio">
            <input
            :id="'blind_'+mode"
            type="radio"
            v-model="selectedBlind.type"
            :value="mode"
            @change="generatePalette"
            />
            <label  :for="'blind_'+mode">{{ mode }}</label>
          </div>
        </div>
        <label class="col-12" for="blindLevel">Anomaly Level</label>
        <input
        id="blindLevel"
        class="col-12"
        type="range"
        min="0"
        max="1"
        step="0.1"
        v-model="selectedBlind.level"
        @input="generatePalette"
        />
      </div>
    </div>
    
    <div class="col-6 col-sm-8 col-md-9 align">
        <div class="align row">
          <div class="col-12 h-100 rounded">
            <svg width="100%" height="64" class="space-svg">
              <rect
              v-for="angle in 360"
              :key="angle"
              :x="angle/3.60+'%'"
              y="0"
              width="1%"
              height="64"
              :fill="rainbowPalette[angle]"
              />
              <circle
              v-for="(color, index) in palette" 
              :key="index"
              :cx="((color.raw[2] || 0)/3.60)+'%'"
              :cy="32"
              r="16px"
              :fill="color.css"
              stroke="white"
              stroke-width="2"
              />
            </svg>
          </div>
        </div>
        
        <div class="align col-12 flex">
          <div
          v-for="(color, index) in palette"
          :key="index"
          class="col-6 col-sm-4 col-md-2 rounded"
          style="aspect-ratio:1/1; padding:8px; min-width:100px;" >
          <div
          :style="{ backgroundColor: color.css }"
          class="w-100 h-100 flex rounded color-box">  
          <template v-if="false"></template>
          <template v-else-if="selectedMode=='Contrast' && !data.bw" v-for="(value, indexb) in color.compare.contrast">
            <span  v-if="index!=indexb" :key="'c'+indexb" :class="'ratio-1 rounded text-center text-small pill' + (value<5?'warn': '')" 
            :style="{
              background: palette[indexb].css, color:palette[indexb].compare.text,width:'21.25%'
            }">{{ value }}</span>
          </template>
          <template v-else-if="selectedMode=='Contrast' && data.bw" v-for="(value, indexb) in color.compare.difference">
            <span  v-if="index!=indexb" :key="'d'+indexb" :class="'ratio-1 rounded text-center text-small pill ' + (value<10?'warn': '')" 
            :style="{
              background:  palette[indexb].css, color:palette[indexb].compare.text, width:'21.25%'
            }">{{ value }}</span>
          </template>
          <template v-else-if="selectedMode=='DeltaE'" v-for="(value, indexb) in color.compare.deltaE">
            <span v-if="index!=indexb" :key="'e'+indexb" :class="'ratio-1 rounded text-center text-small pill ' +(value<30?'warn':'')"
            :style="{
              background: palette[indexb].css, color:palette[indexb].compare.text, width:'21.25%'
            }">{{ value }}</span>
          </template>
          <span  v-else-if="selectedMode=='LCH'" class="ratio-1 rounded text-normal pill" :style="{color: color.text}">{{color.oklch }}</span>
          <span  v-else-if="selectedMode=='CMYK'" class="ratio-1 rounded text-normal pill" :style="{background:color.cmyk[1], color: color.text}">{{color.cmyk[0] }}</span>
          <span  v-else-if="selectedMode=='Hex'" class="ratio-1 rounded text-normal pill" :style="{background:color.hex, color: color.text}">{{color.hex }}</span>
          <span  v-else-if="selectedMode=='Pantone'" class="ratio-1 rounded text-normal pill" :style="{background:color.pantone[1], color: color.text}">{{color.pantone[0] }}</span>
          <span  v-else-if="selectedMode=='RAL'" class="ratio-1 rounded text-normal pill" :style="{ background:color.ral[1], color: color.text}">{{color.ral[0] }}</span>
        </div>
        <div>
        </div>
      </div>
    </div>

</div>
</div>
</template>

<script>
import { ref } from 'vue';

import {applyBlindness, genColor, genGray,  genSmartBaseHues, rainbow, toCSS, wrapPalette} from './palette';

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
    const data = ref({
      base:'#3193F5',
      bw: true,
      LC:{
        pastellifyRange:[-1,8],
        pastellify:0,
      },
      H:{
        mix:0,
        mode:0,
        complementary: false,
      },
      
    })
    const palette = ref([])
    const modes = ['Hex','CMYK', 'LCH', 'Pantone', 'RAL',null,'Contrast','DeltaE',null,'None']
    const modesBlind = ['protanope','deuteranope','tritanope', null,'None',null]
    const selectedBlind = ref({
      type:'none',
      level:1.0
    })
    const selectedMode = ref('none')
    const rainbowPalette = ref([])
    
    const slowgen = throttle(d=>{
      let arr = []
      if(d.bw){
        arr = genColor(d.base,d.H.mix,genSmartBaseHues(d.base,parseInt(d.H.mode)),d.LC.pastellify);
      }else{
        arr = genGray(d.base,d.H.complementary);
      }
      rainbowPalette.value = toCSS(rainbow(d.base).map(p=>applyBlindness(p,selectedBlind.value.type, selectedBlind.value.level)))
      palette.value = wrapPalette(arr, arr.map(p=>applyBlindness(p,selectedBlind.value.type, selectedBlind.value.level)))
    },250)
    
    const generatePalette = () => slowgen(data.value)
    generatePalette();
    
    
    return {
      data,
      rainbowPalette,
      palette,
      generatePalette,
      modes, modesBlind,
      selectedMode, selectedBlind
    };
  },
};
</script>

<style scoped>
.pill {
  align-content: center;
  text-align: center;
  width:100%;
  position: relative;
}

.color-box {
  gap:5% ;
  padding:5%;
  align-content: center;
}

/* .warn {
box-shadow: black 0px 0px 5px;
} */
.warn::after {
  content: '⚠️';
  position: absolute;
  bottom: -0.4em;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.2em;
  pointer-events: none;
}

</style>
