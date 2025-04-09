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
const baseHues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
// const baseHues = [
//     0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270,
//     292.5, 315, 337.5,
// ];
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
    return hues;
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

export function genSmartBaseHues(primaryColor: string): number[] {
    if (!chroma.valid(primaryColor)) throw "Invalid Primary Color";
    const color = chroma(primaryColor).oklch();
    let output = baseHues.map((b) => (color[2] + b) % 360);
    return selectClosestHues(output, rangeHues);
}

export function genColor(
    primaryColor: string,
    mixlevel: number = 0.05,
    bHs: number[] = baseHues,
    over = 0
) {
    if (!chroma.valid(primaryColor)) throw "Invalid Primary Color";
    const color = chroma(primaryColor).oklch();
    const pL = color[0] + 0.05 * over;
    const pC = color[1] - 0.02 * over;
    const pH = color[2];

    const pLp = Min(1, pL / getMax(null, pC, pH));
    const pCp = Min(1, pC / getMax(pL, null, pH));

    const palette = bHs.map((bH) => {
        const h = chroma
            .oklch(pL, pC, bH)
            .mix(chroma.oklch(pL, pC, pH), mixlevel, "oklch")
            .oklch()[2];
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

export function genSVG(palette: LCH_FORMAT[]) {
    let output = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200">`;
    let css_palette = toCSS(palette);
    for (let j in css_palette) {
        output += `<path fill="${css_palette}" d="M${100 * j} 0h100v100H${j * 100
            }z" />`;
    }
    output += `</svg > `;
    return output;
}

export function contrast(a: LCH_FORMAT, b: LCH_FORMAT) {
    return chroma.contrast(chroma.oklch(a[0], a[1], a[2]), chroma.oklch(b[0], b[1], b[2]))
}

export function difference(a: LCH_FORMAT, b: LCH_FORMAT) {
    return chroma.distance(chroma.oklch(a[0], a[1], a[2]), chroma.oklch(b[0], b[1], b[2]))
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
    return palette.map(
        (p) =>
            new simpleColorConverter({
                hex: chroma.oklch(p[0], p[1], p[2]).hex(),
                to: "xyz",
            }).color
    );
}

export function toPantone(palette: LCH_FORMAT[]) {
    return palette.map(
        (p) =>
            new simpleColorConverter({
                hex: chroma.oklch(p[0], p[1], p[2]).hex(),
                to: "pantone",
            }).color
    );
}