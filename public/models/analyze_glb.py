from pygltflib import GLTF2

# Load the GLB file
file_path = "./model.glb"  # Replace with your file's path
gltf = GLTF2().load(file_path)

# Extract and print details
details = {
    "nodes": [node.name for node in gltf.nodes if node.name],
    "meshes": [mesh.name for mesh in gltf.meshes if mesh.name],
    "materials": [material.name for material in gltf.materials if material.name],
    "animations": [
        {
            "name": animation.name if animation.name else "Unnamed Animation",
            "channels": len(animation.channels),
            "samplers": len(animation.samplers),
        }
        for animation in gltf.animations
    ],
}

print("GLB Analysis Details:")
print(details)
