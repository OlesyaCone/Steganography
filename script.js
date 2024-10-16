let encrypt = document.getElementById("encrypt");
let decrypt = document.getElementById("decrypt");
let text = document.getElementById("text");
let result = document.getElementById("result");
let canvas = document.getElementById("key");
let imageInput = document.getElementById("file");

const ctx = canvas.getContext("2d");
const img = new Image();
img.src = "img/orig.webp";


let imageWidth, imageHeight, totalPixels, imageData, key = [];

img.onload = () => {
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  imageWidth = img.width;
  imageHeight = img.height;
  totalPixels = imageWidth * imageHeight;

  imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);

  for (let i = 0; i < totalPixels; i++) {
    let x = i % imageWidth;
    let y = Math.floor(i / imageWidth);

    let green = imageData.data[i * 4 + 1];

    key.push({
      x: x,
      y: y,
      g: green,
    });
  }
  console.log(key);
};

function textToUTF8Bytes(text) {
  const utf8 = [];
  for (let i = 0; i < text.length; i++) {
    let charCode = text.charCodeAt(i);
    if (charCode < 0x80) {
      utf8.push(charCode);
    } else if (charCode < 0x800) {
      utf8.push(0xc0 | (charCode >> 6));
      utf8.push(0x80 | (charCode & 0x3f));
    } else if (charCode < 0x10000) {
      utf8.push(0xe0 | (charCode >> 12));
      utf8.push(0x80 | ((charCode >> 6) & 0x3f));
      utf8.push(0x80 | (charCode & 0x3f));
    }
  }
  return utf8;
}

function utf8BytesToText(bytes) {
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    let byte1 = bytes[i++];
    if (byte1 < 0x80) {
      result += String.fromCharCode(byte1);
    } else if (byte1 < 0xe0) {
      let byte2 = bytes[i++];
      result += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
    } else {
      let byte2 = bytes[i++];
      let byte3 = bytes[i++];
      result += String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f));
    }
  }
  return result;
}

encrypt.addEventListener("click", function () {
  let inputText = text.value;
  let utf8Bytes = textToUTF8Bytes(inputText); 

  for (let i = 0; i < utf8Bytes.length && i < totalPixels; i++) {
    let pixelIndex = i * 4;
    let greenChannel = imageData.data[pixelIndex + 1];
    let greenBinary = greenChannel.toString(2).padStart(8, "0");
    let byteBinary = utf8Bytes[i].toString(2).padStart(8, "0");
    let resultBinary = "";

    for (let j = 0; j < 8; j++) {
      resultBinary += (
        parseInt(byteBinary[j]) ^ parseInt(greenBinary[j])
      ).toString();
    }

    let resultColor = parseInt(resultBinary, 2);
    imageData.data[pixelIndex + 1] = resultColor;
  }

  ctx.putImageData(imageData, 0, 0);

  console.log(`Зашифрованный текст: ${utf8Bytes}`);

  const link = document.createElement("a");
  link.download = "image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

decrypt.addEventListener("click", function () {
  let decodedBytes = [];

  for (let i = 0; i < totalPixels; i++) {
    let originalGreen = key[i].g;
    let currentGreen = imageData.data[i * 4 + 1];
    let decodedBinary = "";
    let originalGreenBinary = originalGreen.toString(2).padStart(8, "0");
    let currentGreenBinary = currentGreen.toString(2).padStart(8, "0");

    for (let j = 0; j < 8; j++) {
      decodedBinary += (
        parseInt(originalGreenBinary[j]) ^ parseInt(currentGreenBinary[j])
      ).toString();
    }
    let decodedByte = parseInt(decodedBinary, 2);
    decodedBytes.push(decodedByte);
  }

  let decodedText = utf8BytesToText(decodedBytes);
  result.innerHTML = `${decodedText}`;
  console.log(`Расшифрованный текст: ${decodedText}`);
});