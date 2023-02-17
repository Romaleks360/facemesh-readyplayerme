const drawingUtils = window;
const mpFaceMesh = window;
const config = {
    locateFile: (file) =>
    {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@` +
            `${mpFaceMesh.VERSION}/${file}`;
    }
};
// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
/**
 * Solution options.
 */
const solutionOptions = {
    selfieMode: true,
    enableFaceGeometry: false,
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
};
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () =>
{
    spinner.style.display = 'none';
};

function adaptLayout ()
{
    if (window.innerWidth / window.innerHeight < 1)
        document.body.style.flexDirection = "column";
    else
        document.body.style.flexDirection = "row";
}
window.addEventListener("resize", adaptLayout);
adaptLayout();

function onResults (results)
{
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiFaceLandmarks && results.multiFaceLandmarks[0])
    {
        let points = results.multiFaceLandmarks[0];

        drawFaceWire(points);

        let faceRig = Kalidokit.Face.solve(points, { runtime: 'mediapipe', video: videoElement, smoothBlink: true })
        setBlendshapes(faceRig);
    }
    canvasCtx.restore();
}

function drawFaceWire (points)
{
    drawingUtils.drawConnectors(canvasCtx, points, mpFaceMesh.FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
    drawingUtils.drawConnectors(canvasCtx, points, mpFaceMesh.FACEMESH_RIGHT_EYE, { color: '#FF3030' });
    drawingUtils.drawConnectors(canvasCtx, points, mpFaceMesh.FACEMESH_RIGHT_EYEBROW, { color: '#FF3030' });
    drawingUtils.drawConnectors(canvasCtx, points, mpFaceMesh.FACEMESH_LEFT_EYE, { color: '#30FF30' });
    drawingUtils.drawConnectors(canvasCtx, points, mpFaceMesh.FACEMESH_LEFT_EYEBROW, { color: '#30FF30' });
    drawingUtils.drawConnectors(canvasCtx, points, mpFaceMesh.FACEMESH_FACE_OVAL, { color: '#E0E0E0' });
    drawingUtils.drawConnectors(canvasCtx, points, mpFaceMesh.FACEMESH_LIPS, { color: '#E0E0E0' });
    if (solutionOptions.refineLandmarks)
    {
        drawingUtils.drawConnectors(canvasCtx, points, mpFaceMesh.FACEMESH_RIGHT_IRIS, { color: '#FF3030' });
        drawingUtils.drawConnectors(canvasCtx, points, mpFaceMesh.FACEMESH_LEFT_IRIS, { color: '#30FF30' });
    }

    // drawingUtils.drawLandmarks(canvasCtx, [points[468], points[473]], { color: 'red' }); // pupils
}

const faceMesh = new mpFaceMesh.FaceMesh(config);
faceMesh.setOptions(solutionOptions);
faceMesh.onResults(onResults);

videoElement.classList.toggle('selfie', solutionOptions.selfieMode);
const camera = new Camera(videoElement, {
    onFrame: async () =>
    {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        await faceMesh.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});
camera.start();


