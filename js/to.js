window.perf_data = null;
window.acft = null;

window.onload = () => {
    var urlParams = new URLSearchParams(window.location.search);
    window.acft = urlParams.get('acft');
    loadData()
        .then((data) => {
            output("name", data.name);
            setOptions("flaps", data.to_flaps);
        });
};

function loadData() {
    if(window.perf_data) {
        return Promise.resolve(window.perf_data);
    }
    return fetch(`data/${window.acft}.json`)
        .then((res) => res.json())
        .then((data) => {
            window.perf_data = data;
            return data;
        });
}

function getNumeric(id) {
    var obj = document.getElementById('in:' + id);
    return parseFloat(obj.value);
}

function input(id) {
    return document.getElementById('in:' + id).value;
}

function setOptions(id, values) {
    var opt = document.getElementById('in:'+id);
    opt.innerHTML = "";
    for(var i in values) {
        opt.innerHTML += `<option value="${values[i]}">${values[i]}</option>`;
    }
}

function output(id, value) {
    document.getElementById('out:' + id).innerHTML = value;
}

function show(id, isShown) {
    document.getElementById(id).style.visibility = isShown ? "visible" : "hidden";
}

function inRange(value, range) {
    if(range === null) return true;
    if(range[0] === null && range[1] === null) return false;
    if(range[0] === null) return value < range[1];
    if(range[1] === null) return value >= range[0];
    return value >= range[0] && value < range[1];
}

function any(array, predicate) {
    for(var i in array) {
        if(predicate(array[i])) return true;
    }
    return false;
}

function pressureAlt(qnh, alt) {
    return alt + 30 * (1013 - qnh);
}

function tableMatches(oat, pa, flaps) {
    return (elt) => {
        console.log(elt, flaps, elt.flaps);
        let conditions = elt.cond;
        return flaps == elt.flaps
            && any(elt.cond, c => inRange(oat, c.temp) && inRange(pa, c.alt));
    };
}

function computeTO(data, oat, tow, qnh, alt, flaps) {
    console.log("flaps: "+flaps);
    let table = data.take_off.find(tableMatches(oat, pressureAlt(qnh, alt), flaps));
    console.log(table.debug);
    if(!table) return `NO T/O PERF DATA FOR FLAPS ${flaps}`;
    table = table.data;

    var speeds = null;
    for(var i in table) {
        let data_tow = table[i][0];
        if(data_tow <= tow) break;
        speeds = table[i];
    }

    if(!speeds) return "T/O WEIGHT OUT OF RANGE";
    return { v1: speeds[1], vr: speeds[2], v2: speeds[3], tgt: speeds[4], vfs: speeds[5] };
}

function showResults(data) {
    if(typeof data !== "string") {
        output('v1', data.v1);
        output('v2', data.v2);
        output('vr', data.vr);
        output('vfs', data.vfs);
        output('tgt', data.tgt);
        show('no-to', false);
    } else {
        output('v1', '---');
        output('v2', '---');
        output('vr', '---');
        output('vfs', '---');
        output('tgt', '---');
        console.log(data);
        show('no-to', true);
    }
}

function start() {
    var oat = getNumeric("oat");
    var tow = getNumeric("tow");
    var qnh = getNumeric("qnh");
    var alt = getNumeric("alt");
    var flaps = parseInt(input("flaps"));

    loadData()
        .then((data) => computeTO(data, oat, tow, qnh, alt, flaps))
        .then(showResults);
}
