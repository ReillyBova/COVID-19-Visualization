import { Group, AmbientLight } from 'three';

export default class BasicLights extends Group {
    constructor(...args) {
        super(...args);

        const ambi = new AmbientLight(0xffffff, 3);

        this.add(ambi);
    }
}
