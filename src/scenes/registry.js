/**
 * Scene Module Contract & Registry
 *
 * Every scene module must export a default object conforming to:
 *
 *   {
 *     id:               string   — unique slug (e.g. "force-network")
 *     name:             string   — human-readable title
 *     description:      string   — one-line narrative purpose
 *     dataRequirements: {
 *       fields:   string[]       — required field names in the dataset
 *       minRows:  number         — minimum row count to be viable
 *       shapes:   string[]       — compatible data shapes:
 *                                   "tabular" | "hierarchical" | "network" | "temporal"
 *     }
 *     component:  React component receiving SceneProps
 *   }
 *
 *   SceneProps = {
 *     data:     any         — preprocessed dataset
 *     width:    number      — available pixel width
 *     height:   number      — available pixel height
 *     onHover:  (datum, event) => void
 *     onLeave:  () => void
 *   }
 *
 *   The component MUST implement:
 *     - enter() transition on mount  (D3 .transition() on initial render)
 *     - exit()  transition on unmount (cleanup via useEffect return)
 */

const sceneRegistry = new Map();

export function registerScene(sceneModule) {
  validate(sceneModule);
  sceneRegistry.set(sceneModule.id, sceneModule);
}

export function getScene(id) {
  return sceneRegistry.get(id);
}

export function getAllScenes() {
  return Array.from(sceneRegistry.values());
}

export function getScenesForData(data) {
  if (!data || !data.length) return [];

  const availableFields = Object.keys(data[0]);
  const rowCount = data.length;

  return getAllScenes()
    .filter((scene) => {
      const { fields, minRows } = scene.dataRequirements;
      if (rowCount < minRows) return false;
      return fields.every((f) => availableFields.includes(f));
    })
    .map((scene) => ({
      ...scene,
      fitness: scoreFitness(scene, availableFields, rowCount),
    }))
    .sort((a, b) => b.fitness - a.fitness);
}

function scoreFitness(scene, availableFields, rowCount) {
  const { fields, minRows } = scene.dataRequirements;
  const fieldCoverage = fields.length / availableFields.length;
  const rowRatio = Math.min(rowCount / minRows, 3) / 3;
  return fieldCoverage * 0.6 + rowRatio * 0.4;
}

function validate(mod) {
  const required = ['id', 'name', 'description', 'dataRequirements', 'component'];
  for (const key of required) {
    if (!(key in mod)) {
      throw new Error(`Scene module "${mod.id || 'unknown'}" missing required key: ${key}`);
    }
  }

  const dr = mod.dataRequirements;
  if (!Array.isArray(dr.fields) || typeof dr.minRows !== 'number' || !Array.isArray(dr.shapes)) {
    throw new Error(
      `Scene "${mod.id}" dataRequirements must have fields:string[], minRows:number, shapes:string[]`
    );
  }
}

export default sceneRegistry;
