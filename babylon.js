var targetIndexByName = [];
var meshes = [];
var headBone;
var headX_KF = new KalmanFilter({ R: 0.05, Q: 0.5 });
var headY_KF = new KalmanFilter({ R: 0.05, Q: 0.5 });
var headZ_KF = new KalmanFilter({ R: 0.05, Q: 0.5 });
var mouthX_KF = new KalmanFilter({ R: 0.1, Q: 0.1 });
var mouthY_KF = new KalmanFilter({ R: 0.1, Q: 0.1 });
var eyeX_KF = new KalmanFilter({ R: 0.1, Q: 0.1 });
var eyeY_KF = new KalmanFilter({ R: 0.1, Q: 0.1 });

async function createScene ()
{
    var scene = new BABYLON.Scene(engine);

    const modelUrl = "https://models.readyplayer.me/633068539b4c6a4352abe4a9.glb?morphTargets=ARKit,Oculus%20Visemes,mouthSmile,mouthOpen"
    await BABYLON.SceneLoader.AppendAsync("", modelUrl, scene);

    scene.createDefaultCameraOrLight(true, true, false);

    scene.activeCamera.alpha += Math.PI;
    scene.activeCamera.radius = 1.5;
    scene.activeCamera.fov = 0.25;
    scene.meshes[0].position.y = -0.75;

    headBone = scene.skeletons[0].bones[5].getTransformNode();
    var head = scene.getMeshByName("Wolf3D_Head");
    for (let i = 0; i < head.morphTargetManager.numTargets; i++)
        targetIndexByName[head.morphTargetManager.getTarget(i).name] = i;

    for (mesh of scene.meshes)
        if (mesh.morphTargetManager)
            meshes.push(mesh.morphTargetManager);

    return scene;
}

function clamp01 (val)
{
    if (val < 0)
        return 0;
    else if (val > 1)
        return 1;
    return val;
}

function invLerp (a, b, value)
{
    return clamp01((value - a) / (b - a));
}

function setBlendshapes (face)
{
    if (!headBone) return;

    headBone.rotation = new BABYLON.Vector3(
        headX_KF.filter(-face.head.x - 0.34),
        headY_KF.filter(-face.head.y),
        headZ_KF.filter(face.head.z));

    face.mouth.x = mouthX_KF.filter(face.mouth.x);
    face.mouth.y = mouthY_KF.filter(face.mouth.y);

    face.pupil.x = eyeX_KF.filter(face.pupil.x + 0.5);
    face.pupil.y = eyeY_KF.filter(face.pupil.y + 0.5);

    for (mesh of meshes)
    {
        mesh.getTarget(targetIndexByName["eyeBlinkRight"]).influence = -face.eye.l + 1;
        mesh.getTarget(targetIndexByName["eyeBlinkLeft"]).influence = -face.eye.r + 1;

        // mesh.getTarget(targetIndexByName["viseme_aa"]).influence = face.mouth.shape.A;
        // mesh.getTarget(targetIndexByName["viseme_E"]).influence = face.mouth.shape.E;
        // mesh.getTarget(targetIndexByName["viseme_I"]).influence = face.mouth.shape.I;
        // mesh.getTarget(targetIndexByName["viseme_O"]).influence = face.mouth.shape.O;
        // mesh.getTarget(targetIndexByName["viseme_U"]).influence = face.mouth.shape.U;

        mesh.getTarget(targetIndexByName["browInnerUp"]).influence = face.brow;
        mesh.getTarget(targetIndexByName["browOuterUpLeft"]).influence = face.brow;
        mesh.getTarget(targetIndexByName["browOuterUpRight"]).influence = face.brow;

        mesh.getTarget(targetIndexByName["mouthPucker"]).influence = clamp01(-face.mouth.x * 2);
        mesh.getTarget(targetIndexByName["mouthSmile"]).influence = clamp01(face.mouth.x * 1.2);
        mesh.getTarget(targetIndexByName["mouthOpen"]).influence = face.mouth.y;
        mesh.getTarget(targetIndexByName["jawOpen"]).influence = face.mouth.y / 2;

        mesh.getTarget(targetIndexByName["eyeLookOutRight"]).influence = clamp01(face.pupil.x);
        mesh.getTarget(targetIndexByName["eyeLookInLeft"]).influence = clamp01(face.pupil.x);
        mesh.getTarget(targetIndexByName["eyeLookInRight"]).influence = clamp01(-face.pupil.x);
        mesh.getTarget(targetIndexByName["eyeLookOutLeft"]).influence = clamp01(-face.pupil.x);

        mesh.getTarget(targetIndexByName["eyeLookUpRight"]).influence = clamp01(face.pupil.y)
        mesh.getTarget(targetIndexByName["eyeLookUpLeft"]).influence = clamp01(face.pupil.y);
        mesh.getTarget(targetIndexByName["eyeLookDownRight"]).influence = clamp01(-face.pupil.y);
        mesh.getTarget(targetIndexByName["eyeLookDownLeft"]).influence = clamp01(-face.pupil.y);
    }
}

// function setBlendshapes (rEyeAspect, lEyeAspect, rEyeX, rEyeY, lEyeX, lEyeY)
// {
//     rEyeAspect = invLerp(0.1, 0.2, rEyeAspect);
//     lEyeAspect = invLerp(0.1, 0.2, lEyeAspect);

//     for (mesh of meshes)
//     {
//         mesh.getTarget(targetIndexByName["eyeBlinkRight"]).influence = -rEyeAspect + 1;
//         mesh.getTarget(targetIndexByName["eyeBlinkLeft"]).influence = -lEyeAspect + 1;

//         mesh.getTarget(targetIndexByName["eyeLookOutRight"]).influence = invLerp(0.5, 0.7, -rEyeX + 1);
//         mesh.getTarget(targetIndexByName["eyeLookInRight"]).influence = invLerp(0.5, 0.7, rEyeX);
//         mesh.getTarget(targetIndexByName["eyeLookUpRight"]).influence = invLerp(0.5, 1, -rEyeY + 1);
//         mesh.getTarget(targetIndexByName["eyeLookDownRight"]).influence = invLerp(0.5, 1, rEyeY);

//         mesh.getTarget(targetIndexByName["eyeLookInLeft"]).influence = invLerp(0.5, 0.7, -lEyeX + 1);
//         mesh.getTarget(targetIndexByName["eyeLookOutLeft"]).influence = invLerp(0.5, 0.7, lEyeX);
//         mesh.getTarget(targetIndexByName["eyeLookUpLeft"]).influence = invLerp(0.5, 1, -lEyeY + 1);
//         mesh.getTarget(targetIndexByName["eyeLookDownLeft"]).influence = invLerp(0.5, 1, lEyeY);
//     }
// }