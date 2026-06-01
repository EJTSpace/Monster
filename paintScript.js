const canvas = document.querySelector(".paintCanvas")
const ctx = canvas.getContext("2d",{ willReadFrequently: true });
ctx.imageSmoothingEnabled = false;
ctx.imageSmoothingQuality = "low";
let imageData;
let data;
let currentMonster = "HairyMonster";
let additionalContentShown = false;

const availableMonsters = ["HairyMonster","WingedMonster","AlienWorld","AlienWorld2"]

const Directions = [
        [-1, 0],       //    Top, 
  [0, -1],   [0, 1],  // Left,   Right
          [1, 0],      //    Bottom
];

coloursObjectRef = {
  red1: "rgb(255,174,201)",
  red2: "rgb(255,0,0)",
  red3: "rgb(180,0,0)",
  orange1: "rgb(255,180,80)",
  orange2: "rgb(255,165,0)",
  orange3: "rgb(160,80,0)",
  yellow1: "rgb(255,255,80)",
  yellow2: "rgb(255,255,0)",
  yellow3: "rgb(180,180,0)",
  green1: "rgb(80,255,80)",
  green2: "rgb(0,255,0)",
  green3: "rgb(0,160,0)",
  blue1: "rgb(80,80,255)",
  blue2: "rgb(0,0,255)",
  blue3: "rgb(0,0,160)",
  purple1: "rgb(125,80,255)",
  purple2: "rgb(125,0,255)",
  purple3: "rgb(80,0,160)",
  grey1: "rgb(255,255,255)",
  grey2: "rgb(140,140,140)",
  grey3: "rgb(80,80,80)",
}

// Match internal resolution to CSS size
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;

  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function loadImage(source="./images/HairyMonster.png") {
  let image = new Image();
  image.src = source;
  image.onload = () => {
    resizeCanvas();
    //const imageElement = document.querySelector(".paintCanvas")
    ctx.drawImage(image, 0, 0,canvas.width,canvas.height)
    //console.log("Canvas Height"+canvas.height)

    // Get all pixels from the canvas
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    data = imageData.data;

    dLength = data.length;

    for (let i = 0; i < dLength; i += 4) {
      if (imageData.data[i] >= 128) {
        imageData.data[i]     = 255;  
        imageData.data[i + 1] = 255;   
        imageData.data[i + 2] = 255;
      } else {
        imageData.data[i]     = 0;   
        imageData.data[i + 1] = 0;   
        imageData.data[i + 2] = 0;
      }  
    }

    currentMonster = source.slice(9,source.length - 4);
    //console.log(currentMonster);

    // Push updated pixels back to canvas
    ctx.putImageData(imageData, 0, 0);
  }
}

//Call load image function for the first time
loadImage();


canvas.addEventListener("click", (e) => {
  //console.log("clicked");
  //Get users selected colour
  //If no colour selected default to red
  let choice = sessionStorage.getItem("paintUserChoice");
  if (!choice) {
    sessionStorage.setItem("paintUserChoice", "rgb(255,0,0)");
    choice = "rgb(255,0,0)";
  }

  //Split the users slected colour into RGB array
  let result = choice.replace("rgb(", "");
  result = result.replace(")", "");
  const [r, g, b] = result.split(",").map(Number);

  //Find out where the user clicked
  //e.clientX, e.clientY
  let rect = canvas.getBoundingClientRect();
  let xPosition = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));;
  let yPosition = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
  //console.log(xPosition);
  //console.log(yPosition);

  //Need to add in a queue and a loop system
  let pixelQueue = [];

  //Formula to get the pixel based on the X and Y values
  let index = (yPosition * canvas.width + xPosition) * 4;

  //If the pixel clicked on is already the correct colour or is black then we don't need to do anything
  if (imageData.data[index] == r && imageData.data[index + 1] == g && imageData.data[index + 2] == b) {
    //Colour is the users selected colour
    return;
  } else if (imageData.data[index] == 0 && imageData.data[index + 1] == 0 && imageData.data[index + 2] == 0) {
    //Colour is black, do not colour over guide lines
    return;    
  } else {
    //If pixel is not users selected colour nor black add the pixel position to the queue

    pixelQueue.push([xPosition,yPosition]);
  }

  // To prevent re-adding pixels that are already waiting in the queue to be processed,
  // we can keep track of visited pixels using a Set or a boolean array.
  const visited = new Uint8Array(canvas.width * canvas.height);

  while (pixelQueue.length > 0 && pixelQueue.length < 100000) {

    let [x, y] = pixelQueue.shift();
    //let x = pixelQueue[0][0];
    //let y = pixelQueue[0][1];
    //console.log("x:"+x);
    //console.log("y:"+y);

    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) { // bounds check
      continue; //If pixel is outside of bounds then simply remove from array queue
    } else {

      let index = (y * canvas.width + x) * 4;
      //console.log(imageData.data[index]);

      // Check if it's black or already colored before painting
      if (imageData.data[index] == r && imageData.data[index + 1] == g && imageData.data[index + 2] == b) {
        //Colour is the users selected colour
        continue;
      } else if (imageData.data[index] == 0 && imageData.data[index + 1] == 0 && imageData.data[index + 2] == 0) {
        //Colour is black, do not colour over guide lines
        continue;    
      }

      //If the pixel is not the correct colour and not black then change the colour
      imageData.data[index]     = r;   // Red
      imageData.data[index + 1] = g;   // Green
      imageData.data[index + 2] = b;   // Blue
      // Alpha (imageData.data[index+3]) stays the same 

      //Search surrounging pixels to check if they need to be added to the array queue
      for (const [dx, dy] of Directions) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= canvas.width || ny >= canvas.height) continue;
        
        index = (ny * canvas.width + nx) * 4;
        let visitedIdx = ny * canvas.width + nx;

        //Skip if already visited
        if (visited[visitedIdx]) continue;

        //If the pixel clicked on is already the correct colour or is black then we don't need to do anything
        if (imageData.data[index] == r && imageData.data[index + 1] == g && imageData.data[index + 2] == b) {
          //Colour is the users selected colour
          continue;
        } else if (imageData.data[index] == 0 && imageData.data[index + 1] == 0 && imageData.data[index + 2] == 0) {
          //Colour is black, do not colour over guide lines
          continue;    
        } else {

          //let isWhite = (imageData.data[index] == 255 && imageData.data[index + 1] == 255 && imageData.data[index + 2] == 255)
          //if (!isWhite) {
            // //Log what pixels we are colouring if they are not black white or selected colour
            //console.log(imageData.data[index]+","+imageData.data[index + 1]+","+imageData.data[index + 2])
          //}

          //If pixel is not users selected colour nor black add the pixel position to the queue
          visited[visitedIdx] = 1;
          pixelQueue.push([nx,ny]);
        }
      }       
      //console.log(pixelQueue)           
    }
  }
  
  
  // Push updated pixels back to canvas
  ctx.putImageData(imageData, 0, 0);
  
  //console.log("added back image data")
})


window.addEventListener("load", () => {
  //const canvas = document.querySelector(".paintCanvas")
  //const ctx = canvas.getContext("2d");

  const colourPickerElement = document.querySelector(".gridWrapper");

  //Create colour palette on the right hand side
  for (const key in coloursObjectRef) {
    if (Object.prototype.hasOwnProperty.call(coloursObjectRef, key)) { // avoid prototype keys
      const element = document.createElement("div");
      element.classList.add("colourSelect",key);
      element.style.backgroundColor = coloursObjectRef[key];
      colourPickerElement.appendChild(element)
      //console.log(key, coloursObjectRef[key]);
      element.addEventListener('click', (event) => {
      // Get the computed background color
      sessionStorage.setItem("paintUserChoice", window.getComputedStyle(event.currentTarget).backgroundColor);
      });

    }
  }

  //Add buttons to the more monsters dropdown
  //This only needs to happen once when the page is loaded
  const dropDownContent = document.querySelector(".dropdown-content");
  dropDownContent.style.display = 'none';
  for (let i = 0; i < availableMonsters.length; i++) {
    if (availableMonsters[i] != currentMonster) {
      const newElement = document.createElement("Button");
      newElement.classList.add("dropdown-item")
      newElement.innerHTML = availableMonsters[i];
      newElement.setAttribute('id', availableMonsters[i]);
      dropDownContent.appendChild(newElement);
      newElement.addEventListener("click", (event) => {
        const dropDownContent = document.querySelector(".dropdown-content");
        button.style.backgroundColor="#5077be";
        dropDownContent.style.display = 'none';
        additionalContentShown = false;
        const heldMonster = currentMonster;
        loadImage(`./images/${event.target.id}.png`);

        event.target.id = heldMonster;
        event.target.innerHTML = heldMonster;

      });
    }
  }

  const button = document.querySelector(".moreMonsters");
  // Add a click event listener to the moreMonesters button
  button.addEventListener("click", () => {
    if (!additionalContentShown) {
      button.style.backgroundColor="DarkSlateBlue";
      dropDownContent.style.display = 'block';
      additionalContentShown = true;
    } else if (additionalContentShown) {
      const dropDownContent = document.querySelector(".dropdown-content");
      button.style.backgroundColor="#5077be";
      dropDownContent.style.display = 'none';
      additionalContentShown = false;
    }
  });

  //console.log("Button text:", e.target.textContent);

})
