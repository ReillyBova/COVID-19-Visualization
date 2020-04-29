import {
    Group,
    IcosahedronBufferGeometry,
    WireframeGeometry,
    LineBasicMaterial,
    LineSegments,
} from 'three';

export default class Background extends Group {
    constructor() {
        super();
        this.name = 'background';
        // Build icosahedron geometry for background
        const backgroundGeometry = new IcosahedronBufferGeometry(30, 4);
        const backgroundWireframe = new WireframeGeometry(backgroundGeometry);
        const backgroundMaterial = new LineBasicMaterial({
            color: 0x777777,
            linewidth: 2,
            depthTest: true,
            opacity: 0.1,
            transparent: true,
        });
        const backgroundLines = new LineSegments(
            backgroundWireframe,
            backgroundMaterial
        );

        // Add background geometry into scene
        this.add(backgroundLines);
    }
}
