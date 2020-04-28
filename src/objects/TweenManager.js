import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

export default class TweenManger {
    constructor() {
        this.numTweensRunning = 0;
    }
    _handleComplete() {
        --this.numTweensRunning;
        console.assert(this.numTweensRunning >= 0); /* eslint no-console: off */
    }
    createTween(targetObject) {
        const self = this;
        ++this.numTweensRunning;
        let userCompleteFn = () => {};
        // create a new tween and install our own onComplete callback
        const tween = new TWEEN.Tween(targetObject).onComplete(function (
            ...args
        ) {
            self._handleComplete();
            userCompleteFn.call(this, ...args);
        });
        // replace the tween's onComplete function with our own
        // so we can call the user's callback if they supply one.
        tween.onComplete = (fn) => {
            userCompleteFn = fn;
            return tween;
        };
        return tween;
    }
    update() {
        TWEEN.update();
        return this.numTweensRunning > 0;
    }
}
