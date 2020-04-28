import { Scene, Color } from 'three';
import Earth from './Earth.js';
import BarGraph from './BarGraph.js';
import BasicLights from './Lights.js';
import * as dat from 'dat.gui';

export default class EarthScene extends Scene {
    constructor() {
        super();

        // Set background to black
        this.background = new Color(0x0a0a0a);

        // Load objects
        const earth = new Earth();
        const barGraph = new BarGraph();
        const lights = new BasicLights();

        this.add(earth, lights, barGraph);

        this.settings = {
            rotate: true
        };

        const gui = new dat.GUI();
        gui.add(this.settings, 'rotate');
    }

    update(timeStamp) {
        if (this.settings.rotate) {
            this.rotation.y = timeStamp / 10000;
        }
    }
}
