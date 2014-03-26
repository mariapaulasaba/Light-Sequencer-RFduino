
var screenWidth; // this is taken from the screen width and used to size other things

var ledSelect = [false,false,false,false,false]; // used to determine whether an led is selected
var initLed = [true,true,true,true,true]; // determines if led was just clicked so its values can reset sliders
var ledIDs = ["led1","led2","led3","led4","led5"]; // the html ids used for targeting the leds
var LedSeqTimes = [0,0,0,0,0,0]; // stores the time associated with note used for how long the led will show
var LedSeqNotes = [0,0,0,0,0,0]; // stores the note value for each led, used with note slider

//stores the values of the led colors
var ledColors =[
[0,0,0],
[0,0,0],
[0,0,0],
[0,0,0],
[0,0,0]
];

var colorString = "rgb(color)"; // blank string used to set led color, replacing "color" with rgb values
var tempString ; // the string result from the colorString replacement

var tExp= 0; // used in an equation to convert bpm and note to actual times in milliseconds	

var noteText = "rest"; // used in a swichcase to to display the textual version of notes next to the slider
var bpmGlobal; // value comes from the bpm slider used ball all leds


var seqState = false ; // toggles the sequence state


var cTime = 0; // current time used in sequence timer
var pTime = 0 ; // previous time used in sequence timer
var ledCount = 0; // a counter that cycle through each led, used in sequencer
var noteLimit;	// taken from each led's LedSeqTime[], used in sequencer 


var connected;

//BLE stuff:
'use strict';

var arrayBufferToFloat = function (ab) {
    var a = new Float32Array(ab);
    return a[0];
};



var app = {
    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
        deviceList.addEventListener('touchstart', this.connect, false); 
    },
   
    onDeviceReady: function() {
       app.refreshDeviceList();
    },
    
    refreshDeviceList: function() {	
       document.getElementById('deviceList').innerHTML = 'Nothing out there yet'; // empties the list
       rfduino.discover(1, app.onDiscoverDevice, app.onError);
    },
    
    onDiscoverDevice: function(device) {
 			document.getElementById('deviceList').innerHTML = '';      
 			 var listItem = document.createElement('li'),
            html = '<b>' + device.name + '</b><br/>' +
                'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
                'Advertising: ' + device.advertising + '<br/>' +
                device.uuid;

        listItem.setAttribute('uuid', device.uuid);
        listItem.innerHTML = html;
        document.getElementById('deviceList').appendChild(listItem);
    },

    connect: function(e) {
        var uuid = e.target.getAttribute('uuid'), 
    	onConnect = function() {
            rfduino.onData(app.onData, app.onError);
            app.showSequencer();
        };
    	rfduino.connect(uuid, onConnect, app.onError);

    },

    writeData: function(data){
        rfduino.write(data);
    },


    disconnect: function() {
        rfduino.disconnect(app.showConnectPage, app.onError);
    },

    showConnectPage: function() {
        document.getElementById('connectPage').style.display = 'block';
        document.getElementById('top').style.display = 'none';
        document.getElementById('controlls').style.display = 'none';
		document.getElementById('colorpicker').color.hidePicker();

    },

    showSequencer: function() {
 		//document.getElementById('debug2').innerHTML = "connected!";
        document.getElementById('connectPage').style.display = 'none';
        document.getElementById('top').style.display = 'block';
        document.getElementById('controlls').style.display = 'block';
		document.getElementById('colorpicker').color.showPicker();

    },
    onError: function(reason) {        
       notification.alert(reason); // real apps should use notification.alert
    },

};






//setup called onload in html and sets the update function to 1 millisecond
//it's 1 millisecond so I could have the timer in the sequencer be accurate
function setup() {

	//initialize all BLE stuff
	app.initialize();

	screenWidth = window.innerWidth;
	screenHeight = window.innerHeight;

	document.getElementById("container").style.height=(screenHeight*0.7) +"px";
	document.getElementById('colorpicker').style.visibility='hidden';
	document.getElementById('colorpicker').color.hidePicker();
		
	setInterval(update, 1);


}



function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

// main chunk of code
function update(){
	
		cTime = cTime + 1; // this is the timer, basically a millis()
		//document.getElementById('debug2').innerHTML = "it is not connected!";

		// the stage where you can set led values, sequencer off
		if(!seqState){
			bpmGlobal = bpm.value;
			bpmVal.innerHTML = bpmGlobal +"bpm";
			noteVal.innerHTML = noteText;

			// the note slider is from 0-4, this sets the text to be displayed according
			switch(note.value){

				case "0":
				noteText = "1 note";

				break;
				case "1":
				noteText = "1/2 note";

				break;
				case "2":
				noteText = "1/4 note";

				break;
				case "3":
				noteText = "1/8 note";

				break;
				case "4":
				noteText = "1/16 note";

				break;

			} /// end note switch


			// cylce through leds looking for the one that selected 
			// and adjust according to value entered in sliders
			for(var i = 0; i<5; i++){

				if(ledSelect[i]){
					// this first part only happens when you initially click the led
					// it resets the sliders to the values already stored for that led
					if(initLed[i]){

						var red = map(ledColors[i][0], 0, 255, 0, 1);
						var green = map(ledColors[i][1], 0, 255, 0, 1);
						var blue = map(ledColors[i][2], 0, 255, 0, 1);

						document.getElementById('colorpicker').color.fromRGB(red, green, blue);
						note.value =   LedSeqNotes[i];
					
						initLed[i] = false; // once sliders are reset we can have the led values = sliders
					}
					else{
						var r = map(document.getElementById('colorpicker').color.rgb[0], 0, 1, 0, 255);
						var g =  map(document.getElementById('colorpicker').color.rgb[1], 0, 1, 0, 255);
						var b = map(document.getElementById('colorpicker').color.rgb[2], 0, 1, 0, 255);

						// store the color and note values from the sliders					
					 	ledColors[i][0] = Math.floor(r);
					 	ledColors[i][1] = Math.floor(g);
					 	ledColors[i][2] = Math.floor(b);
										// ledColors[i][0] = red_range.value ;
						// ledColors[i][1] = green_range.value ;
						// ledColors[i][2] = blue_range.value ;
						LedSeqNotes[i] = note.value;

					}

					// colorString is "rgb(color)" 
					//this replace color with the current led's rgb values and sets it to tempString
					tempString = colorString.replace(/color/, ledColors[i][0] +","+ledColors[i][1] +","+ledColors[i][2]);

					//this funtion is what goes to the html and replaces the led's color
					//it takes the number of led in the ledID[] 
					// and the new tempString which will be the appropriate string with the rgb values
					//document.getElementById('debug2').innerHTML = "it is selecting!!!!!";
					document.getElementById(ledIDs[i]).className = "selected";
					displayLights(i, tempString);
					//document.getElementById('debug2').innerHTML = "displayed lights!";


				}//end ledSelect
				else{
					document.getElementById(ledIDs[i]).className = "";

				}



				// an equation that converts the values in the note slider to time in ms
				// and stores that for use in the sequencer
				tExp = Math.pow(2, LedSeqNotes[i]);
				LedSeqTimes[i] = (60/bpmGlobal)*(1000/tExp);

			}// end for loop


		}///end if seqState false
			
		// this part is basically the sequencer playing, seqState = true 
		else{
			//document.getElementById('debug2').innerHTML = "sequencer playing!!!!!";
		
			//we loop through the leds w/ ledCount
			//noteLimit is part of a timer, how long do we display the current led 
			//we set the timer to the ms time we stored for that led we got from its note value
			noteLimit = LedSeqTimes[ledCount];
			
			// main part of timer, 
			//if time ellapsed is less than the amount of time the current led should be on
			// show only the current led
			if(cTime - pTime < noteLimit){

				for(var j = 0; j<5; j++){

					displayLights(j, "rgb(0,0,0)"); // first cycle through all leds and turn them off

				}

				// now with all of them off, we only turn the current one on
				// this is the same as before with the string stuff and calling displayLights()
				tempString = colorString.replace(/color/, ledColors[ledCount][0] +","+ledColors[ledCount][1] +","+ledColors[ledCount][2]);


				displayLights(ledCount, tempString);




			}
			// if the time ellapsed is over the time the current led should be on for
			// start the timer over(pTime=cTime), and increase the ledcount to the next led
			else{
				pTime = cTime;
				ledCount++;
			
				if(ledCount> 5){
					ledCount = 0; // when we're done with the last led we start over

				}	
			}
		}/// end if seqStat true
} // end update



// this is the led select function called from the html when that led's button is pressed
// it is passed the number of the led that was clicked
// for each it set all the ledStates to false then only the one selected to true
//	it also sets the selected led's initLed value to try, this is the slider resetting thing
function toggle(button){
		
	switch(button){

		case 1:
		app.writeData('1');

			for(var i = 0; i<5; i++){	
				ledSelect[i] = false;
			}
			ledSelect[0] = true;
			initLed[0] = true;
			break;

		case 2 :
		app.writeData('2');

			for(var i = 0; i<5; i++){	
				ledSelect[i] = false;
			
			}
			ledSelect[1] = true;
			initLed[1] = true;
			break;

		case 3 :
			for(var i = 0; i<5; i++){	
				ledSelect[i] = false;

			}	
			ledSelect[2] = true;
			initLed[2] = true;
			break;

		case 4 :
			for(var i = 0; i<5; i++){	
				ledSelect[i] = false;

			}	
			ledSelect[3] = true;
			initLed[3] = true;
			break;

		case 5 :
			for(var i = 0; i<5; i++){	
				ledSelect[i] = false;

			}	
			ledSelect[4] = true;
			initLed[4] = true;
			break;

	} /// end switch	

}// end toggle



// sequencer on/off function called from html when it is clicked
// it toggles the seqState and the color of the button, red=off gree=on

function seqToggle(button){

	if(seqState === true){
		document.getElementById('lights').style.paddingTop = '0px';
		document.getElementById('controlls').style.display = 'block';
//		document.getElementById('seqButton').style.background = 'red';
		document.getElementById('seqButton').innerHTML = "PLAY";
		document.getElementById('colorpicker').color.showPicker();

		// when we turn the sequencer off we have to return all the leds back on
		// all but one would be left black from the sequencer mode otherwise
		for(var i=0;i<5;i++){
			tempString = colorString.replace(/color/, ledColors[i][0] +","+ledColors[i][1] +","+ledColors[i][2]);
			displayLights(i, tempString);

		}


		seqState =false;		
	
	}

	else{
		document.getElementById('lights').style.paddingTop= '75px';
		document.getElementById('controlls').style.display = 'none';
//		document.getElementById('seqButton').style.background = 'green';
		document.getElementById('seqButton').innerHTML = "STOP";
		document.getElementById('colorpicker').color.hidePicker();

		for(var i = 0; i<5; i++){
		document.getElementById(ledIDs[i]).className="";
		}

		seqState = true;
	}

}

// this handles the actual changing of the colors of the leds
// it takes the number of the led we are on and uses it to get the led's id in the html
// it also takes that string which will look like rgb(###,###,###)
// it targets the html element and changes its color
function displayLights(i, tempString2){
	var arduinoString;
	document.getElementById(ledIDs[i]).style.background=tempString2;
	arduinoString = i+","+tempString2.substring(4,(tempString2.length-1))+"n/";
	//console.log(arduinoString);


	///// this is also where we coud send info to arduino
}



