import {
    Group,
    VertexColors,
    Mesh,
    Object3D,
    Color,
    MathUtils,
    BoxBufferGeometry,
    BufferAttribute,
    MeshBasicMaterial,
} from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

function csvJSON(csv) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    const strData = csv;
    const strDelimiter = ',';

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        // Delimiters.
        '(\\' +
            strDelimiter +
            '|\\r?\\n|\\r|^)' +
            // Quoted fields.
            '(?:"([^"]*(?:""[^"]*)*)"|' +
            // Standard fields.
            '([^"\\' +
            strDelimiter +
            '\\r\\n]*))',
        'gi'
    );

    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while ((arrMatches = objPattern.exec(strData))) {
        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
        ) {
            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);
        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {
            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
        } else {
            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];
        }

        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
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
            } else if (key === 'Long_') {
                formattedRow['Long'] = value;
            } else {
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

    // Filter out global US data (except for recovered)
    if (data['Province/State'] === '' && data['Country/Region'] === 'US') {
        data.confirmed = undefined;
        data.death = undefined;
    }

    if (isNaN(data.Lat) || isNaN(data.Long)) {
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

function processData(data) {
    const result = [];
    const longAdjustment = 90;

    let maxLength = 0;
    let maxConfirmed = 0;
    data.forEach(({ confirmed }) => {
        const cases = confirmed[confirmed.length - 1];
        const length = confirmed.length;

        if (length > maxLength) {
            maxLength = length;
        }

        if (cases > maxConfirmed) {
            maxConfirmed = cases;
        }
    });

    let maxDeath = 0;
    data.forEach(({ death }) => {
        const cases = death[death.length - 1];
        const length = death.length;

        if (length > maxLength) {
            maxLength = length;
        }

        if (cases > maxDeath) {
            maxDeath = cases;
        }
    });

    let maxRecovered = 0;
    data.forEach(({ recovered }) => {
        const cases = recovered[recovered.length - 1];
        const length = recovered.length;

        if (length > maxLength) {
            maxLength = length;
        }

        if (cases > maxRecovered) {
            maxRecovered = cases;
        }
    });

    data.forEach(({ Lat, Long, confirmed, death, recovered }) => {
        // Pad arrays up to length with 0s
        let padCount = maxLength - confirmed.length;
        for (let i = 0; i < padCount; i++) {
            confirmed.unshift(-1);
        }
        padCount = maxLength - death.length;
        for (let i = 0; i < padCount; i++) {
            death.unshift(-1);
        }
        padCount = maxLength - recovered.length;
        for (let i = 0; i < padCount; i++) {
            recovered.unshift(-1);
        }

        // Convert lat and long to what we want
        const lat = MathUtils.degToRad(-Lat);
        const long = MathUtils.degToRad(Long + longAdjustment);
        const processed = { lat, long };

        // Create finalized data
        const caseData = { confirmed, death, recovered };
        const maxes = [maxConfirmed, maxDeath, maxRecovered];
        Object.entries(caseData).forEach(([key, values], i) => {
            const maxCases = maxes[i];
            const logMax = Math.log(maxCases + 1);
            // Create log plot
            const logPlot = [];
            values.forEach((count) => {
                if (count < 1) {
                    logPlot.push(-0.5);
                } else {
                    logPlot.push(Math.log(count + 1) / logMax);
                }
            });

            // Create normalized linear plot
            const normPlot = [];
            values.forEach((count) => {
                if (count < 1) {
                    normPlot.push(-0.5);
                } else {
                    normPlot.push(count / maxCases);
                }
            });

            processed['log' + key] = logPlot;
            processed[key] = normPlot;
        });
        result.push(processed);
    });

    this.data = result;
    this.numDays = maxLength;
    this.settings['Day'] = this.numDays - 1;
    this.gui
        .add(this.settings, 'Day')
        .min(0)
        .max(this.numDays - 1)
        .step(1)
        .listen()
        .onChange(this.changeDay.bind(this));
}

export default class BarGraph extends Group {
    constructor(gui) {
        super();
        this.name = 'data';
        this.gui = gui;
        this.plotCache = {};

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
            .then(processData.bind(this))
            .then(() => this.loadPlot('logconfirmed'))
            .then(() => this.changeDay());

        this.settings = {
            Animate: this.startAnimation.bind(this),
        };

        gui.add(this.settings, 'Animate');
        this.animating = false;
    }

    loadPlot(plotname) {
        const { data, numDays } = this;
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

        // Initialize geometries
        const allPlotGeometries = [];
        //const casePlots = ['confirmed', 'death', 'recovered', "logconfirmed", "logrecovered", "logdeath"];
        for (let i = 0; i < numDays; i++) {
            allPlotGeometries.push([]);
        }

        const hues = {
            confirmed: [0.0, 0.2],
            logconfirmed: [0.0, 0.2],
            recovered: [0.4, 0.6],
            logrecovered: [0.4, 0.6],
            death: [0.7, 0.9],
            logdeath: [0.7, 0.9],
        };

        const plotHue = hues[plotname];

        console.log('Building plots!');
        data.forEach(({ lat, long, ...plots }, i) => {
            // adjust the helpers to point to the latitude and longitude
            lonHelper.rotation.y = long;
            latHelper.rotation.x = lat;

            const boxWidth = 1;
            const boxHeight = 1;
            const boxDepth = 1;

            // Initial
            const amounts = plots[plotname];
            for (let i = 0; i < numDays; i++) {
                const value = amounts[i];
                const geometry = new BoxBufferGeometry(
                    boxWidth,
                    boxHeight,
                    boxDepth
                );

                // use the world matrix of the origin helper to
                // position this geometry
                positionHelper.scale.set(
                    0.005,
                    0.005,
                    MathUtils.lerp(0.0015, 0.5, value)
                );
                originHelper.updateWorldMatrix(true, false);
                geometry.applyMatrix4(originHelper.matrixWorld);

                // compute a color
                const hue = MathUtils.lerp(plotHue[0], plotHue[1], value);
                const saturation = 1;
                const lightness =
                    value > 0 ? MathUtils.lerp(0.3, 0.9, value) : 0;
                color.setHSL(hue, saturation, lightness);
                // get the colors as an array of values from 0 to 255
                const rgb = color.toArray().map((v) => v * 255);

                // make an array to store colors for each vertex
                const numVerts = geometry.getAttribute('position').count;
                const itemSize = 3; // r, g, b
                const colors = new Uint8Array(itemSize * numVerts);

                // copy the color into the colors array for each vertex
                colors.forEach((v, ndx) => {
                    colors[ndx] = rgb[ndx % 3];
                });

                const normalized = true;
                const colorAttrib = new BufferAttribute(
                    colors,
                    itemSize,
                    normalized
                );
                geometry.setAttribute('color', colorAttrib);
                allPlotGeometries[i].push(geometry);
            }
        });

        console.log('Merging plots!');

        // Merge plot geometries
        for (let i = 0; i < numDays; i++) {
            const geom = allPlotGeometries[i];
            allPlotGeometries[i] = BufferGeometryUtils.mergeBufferGeometries(
                geom,
                false
            );
        }

        console.log('Creating morphs!');

        const baseGeometry = allPlotGeometries[this.settings['Day']];
        baseGeometry.morphAttributes.position = allPlotGeometries.map(
            (geom, i) => {
                const attribute = geom.getAttribute('position');
                attribute.name = `${i}target`;
                return attribute;
            }
        );

        // Fix color interpolation
        const colorAttributes = allPlotGeometries.map((geom, i) => {
            const attribute = geom.getAttribute('color');
            const name = `morphColor${i}`;
            return { name, attribute };
        });

        const material = new MeshBasicMaterial({
            vertexColors: VertexColors,
            morphTargets: true,
        });

        const vertexShaderReplacements = [
            {
                from: '#include <morphtarget_pars_vertex>',
                to: `
              uniform float morphTargetInfluences[8];
            `,
            },
            {
                from: '#include <morphnormal_vertex>',
                to: `
            `,
            },
            {
                from: '#include <morphtarget_vertex>',
                to: `
              transformed += (morphTarget0 - position) * morphTargetInfluences[0];
              transformed += (morphTarget1 - position) * morphTargetInfluences[1];
              transformed += (morphTarget2 - position) * morphTargetInfluences[2];
              transformed += (morphTarget3 - position) * morphTargetInfluences[3];
            `,
            },
            {
                from: '#include <color_pars_vertex>',
                to: `
              varying vec3 vColor;
              attribute vec3 morphColor0;
              attribute vec3 morphColor1;
              attribute vec3 morphColor2;
              attribute vec3 morphColor3;
            `,
            },
            {
                from: '#include <color_vertex>',
                to: `
              vColor.xyz = morphColor0 * morphTargetInfluences[0] +
                           morphColor1 * morphTargetInfluences[1] +
                           morphColor2 * morphTargetInfluences[2] +
                           morphColor3 * morphTargetInfluences[3];
            `,
            },
        ];
        material.onBeforeCompile = (shader) => {
            vertexShaderReplacements.forEach((rep) => {
                shader.vertexShader = shader.vertexShader.replace(
                    rep.from,
                    rep.to
                );
            });
        };

        const mesh = new Mesh(baseGeometry, material);
        this.barPlotMesh = mesh;
        this.plotCache[plotname] = mesh;
        this.add(mesh);

        mesh.onBeforeRender = function (renderer, scene, camera, geometry) {
            // remove all the color attributes
            for (const { name } of colorAttributes) {
                geometry.deleteAttribute(name);
            }

            for (let i = 0; i < colorAttributes.length; ++i) {
                const attrib = geometry.getAttribute(`morphTarget${i}`);
                if (!attrib) {
                    break;
                }
                // The name will be something like "2target" as we named it above
                // where 2 is the index of the data set
                const ndx = parseInt(attrib.name);
                const name = `morphColor${i}`;
                geometry.setAttribute(name, colorAttributes[ndx].attribute);
            }
        };
    }

    switchPlot(plotName) {
        // Cleanup
        const mesh = this.barPlotMesh;
        if (mesh) {
            console.log('Removing!');
            this.remove(mesh);
        }

        // Load new plot
        if (this.plotCache[plotName] === undefined) {
            this.loadPlot(plotName);
        } else {
            this.add(this.plotCache[plotName]);
            this.barPlotMesh = this.plotCache[plotName];
        }

        this.changeDay();
    }

    changeDay() {
        // Corner case
        if (this.settings['Day'] > this.numDays - 1) {
            return;
        }

        const targets = {};
        const maxDays = this.numDays;
        for (let i = 0; i < maxDays; i++) {
            const active = i === this.settings['Day'] ? 1 : 0;
            targets[i] = active;
        }

        const durationInMs = 500;
        new TWEEN.Tween(this.barPlotMesh.morphTargetInfluences)
            .to(targets, durationInMs)
            .start();
    }

    startAnimation() {
        this.counter = 0;
        if (!this.animating && this.settings['Day'] === this.numDays - 1) {
            this.settings['Day'] = 0;
        }
        this.animating = !this.animating;
    }

    update(timeStamp) {
        if (this.animating) {
            this.counter += 1;
            if (this.counter % 30 === 0) {
                this.settings['Day'] += 1;
                this.counter = 0;
                if (this.settings['Day'] > this.numDays - 1) {
                    this.animating = false;
                    this.settings['Day'] = this.numDays - 1;
                }
                this.changeDay();
            }
        }
        TWEEN.update();
    }
}
