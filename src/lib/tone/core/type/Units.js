/**
 * The units that a value can be converted to.
 */
export var Unit;
(function (Unit) {
    Unit["BPM"] = "bpm";
    Unit["Frequency"] = "hz";
    Unit["Time"] = "s";
    Unit["Ticks"] = "i";
    Unit["TransportTime"] = "s";
    Unit["Notation"] = "n";
    Unit["MIDI"] = "midi";
})(Unit || (Unit = {}));
