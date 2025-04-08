var counter = 0; // number of impulses
var power = 0; // power in watts (assuming 1000imp/kwh)
var lastPulse = getTime();
var pulsePerKwh = 1000;

// Update BLE advertising
function update() {
  print("Updating Advert");
  NRF.setAdvertising(require("BTHome").getAdvertisement([
    {
      type : "battery",
      v : E.getBattery()
    }, {
      type : "energy",
      v : counter/pulsePerKwh // kWh, and usualy 1000 imp/kWh
    }, {
      type : "power",
      v : power // kWh, and usualy 1000 imp/kWh
    }
  ]), {
    name : "Electricity",
    // not being connectable/scannable saves power (but you'll need to reboot to connect again with the IDE!)
    connectable : true, scannable : true, whenConnected: true,
  });
}

// D5 (LED1) is used for sensing
// D1 is used as an output which is also watched with setWatch to detect a state change
var ll = require("NRF52LL");
analogRead(D5);
// set up D1 as an output
digitalWrite(D1,0);
// create a 'toggle' task for pin D1
var tog = ll.gpiote(7, {type:"task",pin:D1,lo2hi:1,hi2lo:1,initialState:0});
// compare D5 against vref/16  (vref:8 would be vref/2)
var comp = ll.lpcomp({pin:D5,vref:4,hyst:true});
// use a PPI to trigger the toggle event
ll.ppiEnable(0, comp.eCross, tog.tOut);
// Detect a change on D1
// Watch for pin changes
setWatch(function(e) {
  let timeDiff = e.time - lastPulse;
  power = (360000000 / pulsePerKwh) / timeDiff; // 1000imp/kwh -> 1000 pulses in 3600sec = 1kW
  power = Number(power.toFixed(0));
  counter++;
  update();
  lastPulse = e.time;
  print('1Wh Detected');
}, D1, { repeat:true, edge:"falling" });

update();