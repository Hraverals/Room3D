import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

export function initFurnitureSystem(scene, camera, renderer, controls) {
    // 1. TransformControls 설정
    const transformControls = new TransformControls(camera, renderer.domElement);
    scene.add(transformControls);

    // 드래그 중에는 OrbitControls(화면 회전) 비활성화
    transformControls.addEventListener("dragging-changed", (event) => {
        controls.enabled = !event.value;
    });

    // 2. Raycaster 설정
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // 3. 더블 클릭 이벤트: 가구 생성
    const onDoubleClick = (event) => {
        // renderer가 위치한 element의 상대 좌표를 계산하는 게 더 정확해
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        // scene.children 중 VGGT 모델이 포함된 객체들과 충돌 검사
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            
            // 기즈모(조절기) 클릭 방지 로직
            const isControl = selectedObject.isTransformControls || 
                              selectedObject.parent?.isTransformControls ||
                              selectedObject.type === "Line";

            if (!isControl) {
                createFurniture(intersects[0].point, scene, transformControls);
            }
        }
    };

    window.addEventListener("dblclick", onDoubleClick);

    // 4. 키보드 단축키 설정
    const onKeyDown = (event) => {
        switch (event.key.toLowerCase()) {
            case "w": transformControls.setMode("translate"); break; // 이동
            case "e": transformControls.setMode("rotate"); break;    // 회전
            case "r": transformControls.setMode("scale"); break;     // 크기
            case "escape": transformControls.detach(); break;       // 선택 해제
            case "delete":
            case "backspace":
                if (transformControls.object) {
                    const target = transformControls.object;
                    transformControls.detach();
                    scene.remove(target);
                }
                break;
        }
    };

    window.addEventListener("keydown", onKeyDown);

    // 이벤트 리스너 제거 함수 (클린업용)
    return () => {
        window.removeEventListener("dblclick", onDoubleClick);
        window.removeEventListener("keydown", onKeyDown);
        transformControls.dispose();
    };
}

function createFurniture(point, scene, transformControls) {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const furniture = new THREE.Mesh(geometry, material);

    furniture.position.copy(point);
    furniture.position.y += 0.25; // 중심점 보정

    scene.add(furniture);
    transformControls.attach(furniture);
}