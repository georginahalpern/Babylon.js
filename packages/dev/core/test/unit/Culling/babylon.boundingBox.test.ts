import { BoundingBox } from "core/Culling/boundingBox";
import { Vector3, Matrix } from "core/Maths/math.vector";
import { Plane } from "core/Maths/math.plane";
import { Frustum } from "core/Maths/math.frustum";

describe("BoundingBox", () => {
    describe("IsObbInFrustum", () => {
        // Helper to create a simple frustum from a view-projection matrix
        const createFrustumPlanes = (viewProjectionMatrix: Matrix): Plane[] => {
            const frustumPlanes: Plane[] = [];
            for (let i = 0; i < 6; i++) {
                frustumPlanes.push(new Plane(0, 0, 0, 0));
            }
            Frustum.GetPlanesToRef(viewProjectionMatrix, frustumPlanes);
            return frustumPlanes;
        };

        // Helper to create a simple orthographic frustum looking down -Z
        const createSimpleOrthographicFrustum = (left: number, right: number, bottom: number, top: number, near: number, far: number): Plane[] => {
            const projection = Matrix.OrthoLH(right - left, top - bottom, near, far);
            const view = Matrix.Identity();
            const viewProjection = view.multiply(projection);
            return createFrustumPlanes(viewProjection);
        };

        it("should return true for an axis-aligned box at origin inside frustum", () => {
            const center = Vector3.Zero();
            const extendSize = new Vector3(1, 1, 1);
            const directions = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];

            // Create a frustum that encompasses the box
            const frustumPlanes = createSimpleOrthographicFrustum(-10, 10, -10, 10, 0.1, 100);

            const result = BoundingBox.IsObbInFrustum(center, extendSize, directions, frustumPlanes);
            expect(result).toBe(true);
        });

        it("should return false for a box completely outside the frustum (behind near plane)", () => {
            const center = new Vector3(0, 0, -10); // Behind camera
            const extendSize = new Vector3(1, 1, 1);
            const directions = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];

            const frustumPlanes = createSimpleOrthographicFrustum(-10, 10, -10, 10, 0.1, 100);

            const result = BoundingBox.IsObbInFrustum(center, extendSize, directions, frustumPlanes);
            expect(result).toBe(false);
        });

        it("should return false for a box completely outside the frustum (beyond far plane)", () => {
            const center = new Vector3(0, 0, 200); // Beyond far plane
            const extendSize = new Vector3(1, 1, 1);
            const directions = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];

            const frustumPlanes = createSimpleOrthographicFrustum(-10, 10, -10, 10, 0.1, 100);

            const result = BoundingBox.IsObbInFrustum(center, extendSize, directions, frustumPlanes);
            expect(result).toBe(false);
        });

        it("should return false for a box completely outside the frustum (to the left)", () => {
            const center = new Vector3(-20, 0, 50); // Outside left plane
            const extendSize = new Vector3(1, 1, 1);
            const directions = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];

            const frustumPlanes = createSimpleOrthographicFrustum(-10, 10, -10, 10, 0.1, 100);

            const result = BoundingBox.IsObbInFrustum(center, extendSize, directions, frustumPlanes);
            expect(result).toBe(false);
        });

        it("should return true for a box partially intersecting the frustum", () => {
            const center = new Vector3(9.5, 0, 50); // Partially outside right plane
            const extendSize = new Vector3(1, 1, 1);
            const directions = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];

            const frustumPlanes = createSimpleOrthographicFrustum(-10, 10, -10, 10, 0.1, 100);

            const result = BoundingBox.IsObbInFrustum(center, extendSize, directions, frustumPlanes);
            expect(result).toBe(true);
        });

        it("should correctly handle a rotated OBB inside frustum", () => {
            const center = new Vector3(0, 0, 50);
            const extendSize = new Vector3(2, 1, 1);

            // Rotate 45 degrees around Z axis
            const angle = Math.PI / 4;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const directions = [new Vector3(cos, sin, 0), new Vector3(-sin, cos, 0), new Vector3(0, 0, 1)];

            const frustumPlanes = createSimpleOrthographicFrustum(-10, 10, -10, 10, 0.1, 100);

            const result = BoundingBox.IsObbInFrustum(center, extendSize, directions, frustumPlanes);
            expect(result).toBe(true);
        });

        it("should correctly reject a rotated OBB outside frustum", () => {
            const center = new Vector3(15, 0, 50); // Outside frustum
            const extendSize = new Vector3(2, 1, 1);

            // Rotate 45 degrees around Z axis
            const angle = Math.PI / 4;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const directions = [new Vector3(cos, sin, 0), new Vector3(-sin, cos, 0), new Vector3(0, 0, 1)];

            const frustumPlanes = createSimpleOrthographicFrustum(-10, 10, -10, 10, 0.1, 100);

            const result = BoundingBox.IsObbInFrustum(center, extendSize, directions, frustumPlanes);
            expect(result).toBe(false);
        });

        it("should handle a rotated OBB that would be outside as AABB but inside as OBB", () => {
            // A long thin box rotated 45 degrees
            // If treated as AABB, it would extend further than the actual OBB
            const center = new Vector3(8, 0, 50);
            const extendSize = new Vector3(3, 0.5, 0.5); // Long thin box

            // Rotate 45 degrees around Z - this makes the AABB larger
            const angle = Math.PI / 4;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const directions = [new Vector3(cos, sin, 0), new Vector3(-sin, cos, 0), new Vector3(0, 0, 1)];

            const frustumPlanes = createSimpleOrthographicFrustum(-10, 10, -10, 10, 0.1, 100);

            // The OBB should be inside because we're testing the actual oriented box
            const result = BoundingBox.IsObbInFrustum(center, extendSize, directions, frustumPlanes);
            expect(result).toBe(true);
        });

        it("should work with a perspective frustum", () => {
            const center = new Vector3(0, 0, 10);
            const extendSize = new Vector3(1, 1, 1);
            const directions = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];

            // Create a perspective projection
            const projection = Matrix.PerspectiveFovLH(Math.PI / 4, 1, 0.1, 100);
            const view = Matrix.Identity();
            const viewProjection = view.multiply(projection);
            const frustumPlanes = createFrustumPlanes(viewProjection);

            const result = BoundingBox.IsObbInFrustum(center, extendSize, directions, frustumPlanes);
            expect(result).toBe(true);
        });

        it("should return false for a box outside perspective frustum field of view", () => {
            const center = new Vector3(50, 0, 10); // Far to the right
            const extendSize = new Vector3(1, 1, 1);
            const directions = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];

            // Create a perspective projection with narrow FOV
            const projection = Matrix.PerspectiveFovLH(Math.PI / 8, 1, 0.1, 100);
            const view = Matrix.Identity();
            const viewProjection = view.multiply(projection);
            const frustumPlanes = createFrustumPlanes(viewProjection);

            const result = BoundingBox.IsObbInFrustum(center, extendSize, directions, frustumPlanes);
            expect(result).toBe(false);
        });
    });

    describe("isInFrustumObb (instance method)", () => {
        it("should use the bounding box world properties for OBB test", () => {
            const min = new Vector3(-1, -1, -1);
            const max = new Vector3(1, 1, 1);

            // Create a world matrix that translates and rotates
            const translation = Matrix.Translation(0, 0, 50);
            const rotation = Matrix.RotationZ(Math.PI / 4);
            const worldMatrix = rotation.multiply(translation);

            const boundingBox = new BoundingBox(min, max, worldMatrix);

            // Create frustum
            const projection = Matrix.OrthoLH(20, 20, 0.1, 100);
            const view = Matrix.Identity();
            const viewProjection = view.multiply(projection);
            const frustumPlanes: Plane[] = [];
            for (let i = 0; i < 6; i++) {
                frustumPlanes.push(new Plane(0, 0, 0, 0));
            }
            Frustum.GetPlanesToRef(viewProjection, frustumPlanes);

            const result = boundingBox.isInFrustumObb(frustumPlanes);
            expect(result).toBe(true);
        });
    });
});
