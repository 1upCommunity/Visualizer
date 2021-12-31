var amplitude
var sound
var fft
var osc

let framesSinceLastBeat = 0;
let beatCutoff = 0.001;
let beatThreshold = 0.35;
let beatHoldFrames = 30;
let beatDecayRate = 0.97;

let bufLen
var analyzer;
var numSamples = 1024;

// Array of amplitude values (-1 to +1) over time.
var samples = [];

function preload() {
    sound = loadSound('assets/Punch Deck - Neon Underworld.mp3');
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    // create a new Amplitude analyzer
    amplitude = new p5.Amplitude();

    // Patch the input to an volume analyzer
    amplitude.setInput(sound);

    // Start the sound
    sound.play();

    fft = new p5.FFT(0.8, 1024);
    fft.setInput(sound);

    analyzer = new p5.FFT(0, numSamples);
    analyzer.setInput(sound);
}

function draw() {
    background(0);
    stroke(255);
    strokeWeight(4);
    fill(255, 255, 255)
    loudness = amplitude.getLevel();
    value = 500

    var spectrum = fft.analyze();
  
    // scaledSpectrum is a new, smaller array of more meaningful values
    var scaledSpectrum = splitOctaves(spectrum, 3);
    
    noFill()
    if(frameCount % 2 == 0) {
        // get a buffer of 1024 samples over time.
        samples = analyzer.waveform();
        bufLen = samples.length;
    }

    // draw snapshot of the samples
    strokeWeight(4);
    beginShape();
    for (var i = 0; i < bufLen; i++){
        var x = map(i, 0, bufLen, 0, width);
        var y = map(samples[i], -1, 1, -height/2, height/2);
        vertex(x, y + height/2);
    }
    endShape();
    
    noStroke();
    detectBeat(loudness);
    fill(200, 200, 200)
    ellipse(windowWidth / 2, windowHeight / 2, 500 +  framesSinceLastBeat * 2 + loudness * 100, 500 + framesSinceLastBeat * 2 + loudness * 100);

    if(loudness > 0.35) {
        fill(0, 255, 0)
        ellipse(windowWidth / 2, windowHeight / 2, loudness * value * 3.25, loudness * value * 3.25);
    }

    fill(255, 255, 255)
    ellipse(windowWidth / 2, windowHeight / 2, loudness * value, loudness * value);

    textSize(windowWidth / 100);
    text("Now playing: Punch Deck - Neon Underworld", windowWidth / 2 - textWidth("Now playing: Punch Deck - Neon Underworld") / 2, windowHeight / 10 * 9);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function detectBeat(level) {
    if (level  > beatCutoff && level > beatThreshold){
      beatCutoff = level *1.2;
      framesSinceLastBeat = 0;
    } else{
      if (framesSinceLastBeat <= beatHoldFrames){
        framesSinceLastBeat ++;
      }
      else{
        beatCutoff *= beatDecayRate;
        beatCutoff = Math.max(beatCutoff, beatThreshold);
      }
    }
}

/**
 *  Divides an fft array into octaves with each
 *  divided by three, or by a specified "slicesPerOctave".
 *  
 *  There are 10 octaves in the range 20 - 20,000 Hz,
 *  so this will result in 10 * slicesPerOctave + 1
 *
 *  @method splitOctaves
 *  @param {Array} spectrum Array of fft.analyze() values
 *  @param {Number} [slicesPerOctave] defaults to thirds
 *  @return {Array} scaledSpectrum array of the spectrum reorganized by division
 *                                 of octaves
 */
 function splitOctaves(spectrum, slicesPerOctave) {
    var scaledSpectrum = [];
    var len = spectrum.length;
  
    // default to thirds
    var n = slicesPerOctave|| 3;
    var nthRootOfTwo = Math.pow(2, 1/n);
  
    // the last N bins get their own 
    var lowestBin = slicesPerOctave;
  
    var binIndex = len - 1;
    var i = binIndex;
  
  
    while (i > lowestBin) {
      var nextBinIndex = round( binIndex/nthRootOfTwo );
  
      if (nextBinIndex === 1) return;
  
      var total = 0;
      var numBins = 0;
  
      // add up all of the values for the frequencies
      for (i = binIndex; i > nextBinIndex; i--) {
        total += spectrum[i];
        numBins++;
      }
  
      // divide total sum by number of bins
      var energy = total/numBins;
      scaledSpectrum.push(energy);
  
      // keep the loop going
      binIndex = nextBinIndex;
    }
  
    // add the lowest bins at the end
    for (var j = i; j > 0; j--) {
      scaledSpectrum.push(spectrum[j]);
    }
  
    // reverse so that array has same order as original array (low to high frequencies)
    scaledSpectrum.reverse();
  
    return scaledSpectrum;
  }
  
  
  
  // average a point in an array with its neighbors
  function smoothPoint(spectrum, index, numberOfNeighbors) {
  
    // default to 2 neighbors on either side
    var neighbors = numberOfNeighbors || 2;
    var len = spectrum.length;
  
    var val = 0;
  
    // start below the index
    var indexMinusNeighbors = index - neighbors;
    var smoothedPoints = 0;
  
    for (var i = indexMinusNeighbors; i < (index+neighbors) && i < len; i++) {
      // if there is a point at spectrum[i], tally it
      if (typeof(spectrum[i]) !== 'undefined') {
        val += spectrum[i];
        smoothedPoints++;
      }
    }
  
    val = val/smoothedPoints;
  
    return val;
  }
