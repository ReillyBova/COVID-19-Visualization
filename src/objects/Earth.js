import {
    Group,
    TextureLoader,
    SphereBufferGeometry,
    MeshLambertMaterial,
    Mesh,
} from 'three';
import TEXTURE from './earth.jpg';

export default class Earth extends Group {
    constructor() {
        super();
        this.name = 'earth';

        const loader = new TextureLoader();

        const texture = loader.load(TEXTURE);
        const geometry = new SphereBufferGeometry(1, 64, 32);
        const material = new MeshLambertMaterial({ map: texture });
        this.add(new Mesh(geometry, material));
    }
}
