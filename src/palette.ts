import chroma from "chroma-js";
import simpleColorConverter from "simple-color-converter";

declare type LCH_FORMAT = [number, number, number];
declare type HueRange = {
    min: number;
    max: number;
    preferred: number;
};

const Max = Math.max;
const Min = Math.min;

const rangeHues: HueRange[] = [
    { min: 45, max: 75, preferred: 60 }, // Orange → Yellow
    { min: 70, max: 120, preferred: 105 }, // Yellow → Lime
    { min: 110, max: 170, preferred: 135 }, // Green
    { min: 160, max: 210, preferred: 170 }, // Cyan / Teal
    { min: 200, max: 260, preferred: 235 }, // Blue
    { min: 250, max: 300, preferred: 295 }, // Purple
    { min: 300, max: 10, preferred: 350 }, // Pink → Magenta
    { min: 10, max: 50, preferred: 30 }, // Red → Orange
];

function hueDistance(a: number, b: number): number {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
}

function isHueInRange(hue: number, range: HueRange): boolean {
    if (range.min <= range.max) return hue >= range.min && hue <= range.max;
    return hue >= range.min || hue <= range.max;
}

function selectClosestHues(hues: number[], ranges: HueRange[]): number[] {
    return ranges
        .map((range) => {
            const matchingHues = hues.filter((h) => isHueInRange(h, range));
            if (matchingHues.length === 0) return null;
            return matchingHues.reduce((closest, hue) => {
                return hueDistance(hue, range.preferred) <
                    hueDistance(closest, range.preferred)
                    ? hue
                    : closest;
            });
        })
        .filter((hue) => hue !== null);
}

function gaussianCurve(points: number, mean = 0.5, sigma = 0.15) {
    const x = Array.from({ length: points + 1 }, (_, i) => i / points);
    const invertedGaussianWeights = x.map(
        (value) =>
            1 - Math.exp(-Math.pow(value - mean, 2) / (2 * Math.pow(sigma, 2)))
    );
    const weightSum = invertedGaussianWeights.reduce(
        (sum, weight) => sum + weight,
        0
    );
    const normalizedWeights = invertedGaussianWeights.map(
        (weight) => weight / weightSum
    );
    const cumulativeWeights = normalizedWeights.reduce((acc, weight) => {
        acc.push((acc[acc.length - 1] || 0) + weight);
        return acc;
    }, [] as number[]);
    const min = Min(...cumulativeWeights);
    const max = Max(...cumulativeWeights);
    return cumulativeWeights.map((value) => (value - min) / (max - min));
}

const lerp = (a: number, b: number, x: number) => a * (1 - x) + b * x;

function getMax(l: number | null, c: number | null, h: number, step = 0.01) {
    for (let i = 1; i >= 0; i -= step)
        if (
            !chroma
                .oklch(l == null ? i : l, c == null ? i : c, h == null ? i : h)
                .clipped()
        )
            return i;
    return 0;
}

function getMin(l: number | null, c: number | null, h: number, step = 0.01) {
    for (let i = 0; i <= 1; i += step)
        if (
            !chroma
                .oklch(l == null ? i : l, c == null ? i : c, h == null ? i : h)
                .clipped()
        )
            return i;
    return 1;
}

export function genSmartBaseHues(primaryColor: string, algo: number = 0): number[] {
    if (!chroma.valid(primaryColor)) throw "Invalid Primary Color";
    const color = chroma(primaryColor).oklch();
    switch (algo) {
        case 0: {
            let output = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((b) => (color[2] + b) % 360);

            return selectClosestHues(output, rangeHues).sort((a, b) => Math.abs(a - color[2]) - Math.abs(b - color[2]));
        }
        case 1: {
            let output = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((b) => (color[2] + b) % 360);
            return output;
        }
        case 2: {
            let output = [
                color[2], (color[2] + 180) % 360,
                (color[2] + 330) % 360, (color[2] + 30) % 360,
                (color[2] + 150) % 360, (color[2] + 210) % 360,
                (color[2] + 90) % 360, (color[2] + 270) % 360,
            ]
            return output
        }
        case 3: {
            let output = [
                color[2], (color[2] + 180) % 360,
                (color[2] + 315) % 360, (color[2] + 45) % 360,
                (color[2] + 135) % 360, (color[2] + 225) % 360,
                (color[2] + 90) % 360, (color[2] + 270) % 360,
            ]
            return output
        }
    }
    return []
}

export function genColor(
    primaryColor: string,
    mixlevel: number = 0,
    bHs: number[] = [],
    over = 0, s: boolean = true
) {
    if (!chroma.valid(primaryColor)) throw "Invalid Primary Color";
    const color = chroma(primaryColor).oklch();
    const pL = color[0] + 0.05 * over;
    const pC = color[1] - 0.02 * over;
    const pH = color[2];

    const pLp = Min(1, pL / getMax(null, pC, pH));
    const pCp = Min(1, pC / getMax(pL, null, pH));

    const palette = bHs.map((bH) => {
        let h = bH
        if (mixlevel > 0) {
            h = s ? (chroma
                .oklch(pL, pC, bH)
                .mix(chroma.oklch(pL, pC, pH), mixlevel, "oklch")
                .oklch()[2]) : (((((bH - pH + 360) % 360) * (1 - mixlevel)) + pH) % 360)
        }
        let l = pLp * getMax(null, pC, h) || pL;
        let c = pCp * getMax(l, null, h) || pC;
        for (let itr = 0; itr < 100; ++itr) {
            l = pLp * getMax(null, c, h) || pL;
            c = pCp * getMax(l, null, h) || pC;
        }
        return chroma.oklch(l, c, h).oklch();

    });

    return palette;
}

export function genGray(primaryColor: string, c: boolean = true) {
    if (!chroma.valid(primaryColor)) throw "Invalid Primary Color";
    const color = chroma(primaryColor).oklch();
    const pH = (color[2] + (c ? 180 : 0)) % 360;
    let bLs = gaussianCurve(8, 0.99, 0.05);
    bLs.pop()
    const palette = bLs.map((bL) => {
        const h = pH;
        const c = lerp(getMin(bL, null, pH), getMax(bL, null, pH), 0.33);
        const l = Min(Max(bL, getMin(null, c, pH)), getMax(null, c, pH));

        return chroma.oklch(l, c, h).oklch();
    });
    return palette;
}

export function contrast(a: LCH_FORMAT, b: LCH_FORMAT) {
    return chroma.contrast(chroma.oklch(a[0], a[1], a[2]), chroma.oklch(b[0], b[1], b[2]))
}

export function difference(a: LCH_FORMAT, b: LCH_FORMAT) {
    return chroma.distance(chroma.oklch(a[0], a[1], a[2]), chroma.oklch(b[0], b[1], b[2]), 'oklch')
}
export function deltaE(a: LCH_FORMAT, b: LCH_FORMAT) {
    return chroma.deltaE(chroma.oklch(a[0], a[1], a[2]), chroma.oklch(b[0], b[1], b[2]))
}

export function toLCH(hex: string) {
    return chroma(hex).oklch();
}

export function toHex(palette: LCH_FORMAT[]) {
    return palette.map((p) => chroma.oklch(p[0], p[1], p[2]).hex());
}

export function toCMYK(palette: LCH_FORMAT[]) {
    return palette.map((p) => chroma.oklch(p[0], p[1], p[2]).cmyk());
}

export function toCSS(palette: LCH_FORMAT[]) {
    return palette.map((p) => chroma.oklch(p[0], p[1], p[2]).css("oklch"));
}

export function toXYZ(palette: LCH_FORMAT[]) {
    return palette.map(p =>
        new simpleColorConverter({
            lab: chroma.oklch(p[0], p[1], p[2]).lab(),
            to: "xyz",
        }).color
    );
}

function toOKLCH(lab: any) {
    return chroma.lab(lab.l, lab.a, lab.b).css('oklch')
}

export function toPantone(palette: LCH_FORMAT[]) {
    return palette.map(p =>
        new simpleColorConverter({
            lab: chroma.oklch(p[0], p[1], p[2]).lab(),
            to: "pantone",
        }).color
    ).map(p => [p,
        toOKLCH(new simpleColorConverter({
            pantone: p,
            to: "lab",
        }).color)
    ]);
}

export function rainbow(base: string): string[] {
    let b = toLCH(base)
    return Array.from({ length: 360 }, (_, i) => toCSS([[b[0], b[1], i]])[0])
}

export function wrapPalette(arr: LCH_FORMAT[]) {
    let raw = arr
    let css = toCSS(arr)
    let pantone = toPantone(arr)
    let hex = toHex(arr)
    let cmyk = toCMYK(arr)
    return Array.from({ length: arr.length }, (_, i) => ({
        css: css[i],
        raw: raw[i],
        pantone: pantone[i],
        hex: hex[i],
        cmyk: cmyk[i],
        compare: {
            contrast: Array.from({ length: arr.length }, (_, j) => Math.abs(Math.round(contrast(raw[i], raw[j])))),
            difference: Array.from({ length: arr.length }, (_, j) => Math.abs(Math.round(difference(raw[i], raw[j])))),
            deltaE: Array.from({ length: arr.length }, (_, j) => Math.abs(Math.round(deltaE(raw[i], raw[j])))),
            text: toCSS([[[0, 0, 0], [150, 0, 0]].reduce((a, b) => contrast(a as LCH_FORMAT, raw[i]) > contrast(b as LCH_FORMAT, raw[i]) ? a : b) as LCH_FORMAT])
        }
    }));
}
