import { Scene, Color } from 'three';
import Earth from './Earth.js';
import Background from './Background.js';
import BarGraph from './BarGraph.js';
import BasicLights from './Lights.js';
import * as dat from 'dat.gui';

export default class EarthScene extends Scene {
    constructor() {
        super();

        // Set background to black
        this.background = new Color(0x030303);

        // Add gui
        const gui = new dat.GUI();
        this.settings = {
            'Auto Rotate': false,
            'Log Plot': true,
            Data: 'confirmed',
        };

        // Load objects

        const earth = new Earth();
        const background = new Background();
        const barGraph = new BarGraph(gui);
        const lights = new BasicLights();
        this.barGraph = barGraph;

        this.add(earth, lights, barGraph, background);

        const changePlot = () => {
            this.rotation.y = 0;
            const logPlot = this.settings['Log Plot'];
            const plotName = this.settings['Data'];
            const newPlotName = logPlot ? 'log' + plotName : plotName;
            barGraph.switchPlot(newPlotName);
            this.rotation.y = 0;
        };

        // Populate GUI
        gui.add(this.settings, 'Auto Rotate');
        gui.add(this.settings, 'Log Plot').onFinishChange(changePlot);
        gui.add(this.settings, 'Data', {
            Confirmed: 'confirmed',
            Deaths: 'death',
            Recovered: 'recovered',
        }).onFinishChange(changePlot);
    }

    update(timeStamp) {
        if (this.settings['Auto Rotate']) {
            this.rotation.y += 1 / 300;
        }

        this.barGraph.update(timeStamp);
    }
}
