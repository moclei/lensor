import fragment1 from './shaders/fragment1.glfs.js';
import fragment2 from './shaders/fragment2.glfs.js';
import fragment3 from './shaders/fragment3.glfs.js';
import method1 from './shaders/method1.glfs.js';
import method2 from './shaders/method2.glfs.js';
import vertex from './shaders/vertex.glvs.js';


interface Shader {
    [key: string]: any;
    fragment1: any;
    fragment2: any;
    fragment3: any;
    method1: any;
    method2: any;
    vertex: any;
}

const shaders: Shader = { fragment1, fragment2, fragment3, method1, method2, vertex };

export default shaders;