import * as Fs from 'fs-extra';

export const toInt = (val: any, def: number = 0): number => {
  if (typeof val === 'string') {
    return parseInt(val, 10);
  }
  return !isNaN(val) && Number.isInteger(val) ? val : def;
};

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const decodeURLParams = (search: string): Record<string, any> => {
  if (!search) return {};
  const hashes = search.slice(search.indexOf('?') + 1).split('&');
  return hashes.reduce((params, hash) => {
    const split = hash.indexOf('=');
    if (split === -1) {
      return params;
    }
    const key = hash.slice(0, split);
    const val = hash.slice(split + 1);
    return Object.assign(params, { [key]: decodeURIComponent(val) });
  }, {});
};

export function toArrayBuffer(buf: any) {
  let ab = new ArrayBuffer(buf.length);
  let view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

export async function pushToFile(file: string, data: string) {
  try {
    await Fs.appendFile(`./dataset/${file}`, `${data}\n`);
  } catch {}
}

export function getHexColorFromImage(
  img: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
) {
  const i = 4 * (y * width + x);
  return (
    '#' +
    (
      (Math.max(0, img[i + 0]) << 16) |
      (Math.max(0, img[i + 1]) << 8) |
      Math.max(0, img[i + 2])
    )
      .toString(16)
      .toUpperCase()
  );
}

export function hexColorToInt(e) {
  return parseInt(e.toString().replace('#', ''), 16);
}

export function findClosestColor(
  targetColor: [number, number, number],
  colorArray: (readonly [number, number, number])[],
) {
  // Преобразуем целевой цвет из RGB в HSL
  const [targetRed, targetGreen, targetBlue] = targetColor;
  const [targetHue, targetSaturation, targetLightness] = rgbToHsl(
    targetRed,
    targetGreen,
    targetBlue,
  );

  // Инициализируем переменные для хранения наименьшего расстояния и соответствующего цвета
  let closestDistance = Infinity;
  let closestColor: readonly [number, number, number] = null;

  // Итерируемся по массиву цветов и ищем ближайший к целевому цвету
  for (let i = 0; i < colorArray.length; i++) {
    const [red, green, blue] = colorArray[i];

    // Преобразуем текущий цвет из RGB в HSL
    const [hue, saturation, lightness] = rgbToHsl(red, green, blue);

    // Вычисляем расстояние между целевым цветом и текущим цветом в HSL пространстве
    const distance = Math.sqrt(
      Math.pow(targetHue - hue, 2) +
        Math.pow(targetSaturation - saturation, 2) +
        Math.pow(targetLightness - lightness, 2),
    );

    // Если текущий цвет ближе к целевому, чем предыдущий ближайший цвет, обновляем значения
    if (distance < closestDistance) {
      closestDistance = distance;
      closestColor = colorArray[i];
    }
  }

  return closestColor as [number, number, number];
}

// Функция для преобразования RGB в HSL
function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h: number, s: number;
  let l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // оттенок не имеет значения, насыщенность 0
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l] as const;
}
