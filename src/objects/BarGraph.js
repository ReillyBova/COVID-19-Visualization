import { Group, VertexColors, Mesh, Object3D, Color, MathUtils, BoxBufferGeometry, BufferAttribute , MeshBasicMaterial } from 'three';
import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function csvJSON(csv) {
    // Check to see if the delimiter is defined. If not,
        // then default to comma.
        const strData = csv;
        const strDelimiter = (",");

        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
            );


        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;


        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
                ){

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push( [] );

            }

            var strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                    );

            } else {

                // We found a non-quoted value.
                strMatchedValue = arrMatches[ 3 ];

            }


            // Now that we have our value string, let's add
            // it to the data array.
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }

    const lines = arrData;
    const result = [];
    const headers = arrData[0];

    for (var i = 1; i < lines.length; i++) {
        var obj = {};
        var currentline = lines[i];

        for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }

        result.push(obj);
    } //return result; //JavaScript object

    return result; //JSON
}

async function loadFile(url1) {
    const file1 = (await fetch(url1)).text();

    return file1;
}

function group(csv, type) {
    const result = [];
    for (let i = 0; i < csv.length; i++) {
        const row = csv[i];
        const entries = Object.entries(row);

        const formattedRow = {};
        let cases = [];
        for (let [key, value] of entries) {
            if (key.match(/^[0-9]+\/[0-9]+\/[0-9]+$/)) {
                cases.push(value);
            } else if (key === "Long_") {
                formattedRow["Long"] = value;
            }
            else {
                formattedRow[key] = value;
            }
        }
        let key = type;
        formattedRow[type] = cases;
        result.push(formattedRow);
    }
    return result;
}

function merge(data) {

    const accumulated = {};

    for (const element of data) {
        let key = element.Lat + ' ' + element.Long; // add new object

        if (accumulated[key] === undefined) {
            accumulated[key] = {};
        }

        accumulated[key] = { ...accumulated[key], ...element };
    }
    return Object.values(accumulated);
}

function clean(data) {
    data.Lat = parseFloat(data.Lat);
    data.Long = parseFloat(data.Long);

    if (isNaN(data.Lat)|| isNaN(data.Long)) {
        return null;
    }

    if (data.confirmed !== undefined) {
        for (let i = 0; i < data.confirmed.length; i++) {
            data.confirmed[i] = parseInt(data.confirmed[i]);
        }
    } else {
        data.confirmed = [];
    }

    if (data.death !== undefined) {
        for (let i = 0; i < data.death.length; i++) {
            data.death[i] = parseInt(data.death[i]);
        }
    } else {
        data.death = [];
    }

    if (data.recovered !== undefined) {
        for (let i = 0; i < data.recovered.length; i++) {
            data.recovered[i] = parseInt(data.recovered[i]);
        }
    } else {
        data.recovered = [];
    }

    return data;
}

function addBoxes(data) {
    // these helpers will make it easy to position the boxes
    // We can rotate the lon helper on its Y axis to the longitude
    const lonHelper = new Object3D();
    this.add(lonHelper);
    // We rotate the latHelper on its X axis to the latitude
    const latHelper = new Object3D();
    lonHelper.add(latHelper);
    // The position helper moves the object to the edge of the sphere
    const positionHelper = new Object3D();
    positionHelper.position.z = 1;
    latHelper.add(positionHelper);

    // Used to move the center of the cube so it scales from the position Z axis
    const originHelper = new Object3D();
    originHelper.position.z = 0.5;
    positionHelper.add(originHelper);

    const color = new Color();

    const lonFudge = Math.PI * .5;
    const latFudge = Math.PI * -0.135;
    const geometries = [];
    data.forEach(({confirmed, Lat, Long, ...other}, i) => {
        const latNdx = Lat;
        const lonNdx  = Long;
        const value = confirmed[confirmed.length - 1] + 1;
        if (value === undefined || isNaN(value)) {
          return;
        }

        const amount = Math.log10(value) / 5;

        const boxWidth = 1;
        const boxHeight = 1;
        const boxDepth = 1;
        const geometry = new BoxBufferGeometry(boxWidth, boxHeight, boxDepth);

        // adjust the helpers to point to the latitude and longitude
        lonHelper.rotation.y = MathUtils.degToRad(lonNdx + 86.5);
        latHelper.rotation.x = MathUtils.degToRad(-latNdx);

        // use the world matrix of the origin helper to
        // position this geometry
        positionHelper.scale.set(0.005, 0.005, MathUtils.lerp(0.01, 0.5, amount));
        originHelper.updateWorldMatrix(true, false);
        geometry.applyMatrix4(originHelper.matrixWorld);

        // compute a color
        const hue = MathUtils.lerp(0.0, 0.3, amount);
        const saturation = 1;
        const lightness = MathUtils.lerp(0.4, 1.0, amount);
        color.setHSL(hue, saturation, lightness);
        // get the colors as an array of values from 0 to 255
        const rgb = color.toArray().map(v => v * 255);

        // make an array to store colors for each vertex
        const numVerts = geometry.getAttribute('position').count;
        const itemSize = 3;  // r, g, b
        const colors = new Uint8Array(itemSize * numVerts);

        // copy the color into the colors array for each vertex
        colors.forEach((v, ndx) => {
          colors[ndx] = rgb[ndx % 3];
        });

        const normalized = true;
        const colorAttrib = new BufferAttribute(colors, itemSize, normalized);
        geometry.setAttribute('color', colorAttrib);

        geometries.push(geometry);
    });

    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
        geometries, false);
    const material = new MeshBasicMaterial({
      vertexColors: VertexColors,
    });
    const mesh = new Mesh(mergedGeometry, material);
    this.add(mesh);
  }

export default class BarGraph extends Group {
    constructor() {
        super();
        this.name = 'data';

        const urls = [
            'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
            'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv',
            'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv',
            'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv',
            'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv',
        ];
        const types = ['confirmed', 'death', 'recovered', 'confirmed', 'death'];
        const requests = urls.map((url) => loadFile(url).then(csvJSON));
        const toMembers = (responses) =>
            responses.map((response) => response.members);

        Promise.all(requests)
            .then((members) =>
                members.map((member, i) => group(member, types[i])).flat()
            )
            .then(merge)
            .then((data) => data.map(clean))
            .then((data) => data.filter((element) => !!element))
            .then(addBoxes.bind(this));
    }
}
