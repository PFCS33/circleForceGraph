import vegaEmbed from "vega-embed";

/* draw vl-graph inside the panel
  container: d3's selector
  data: corresponding data, containing 'vega-ltie'
*/
const drawVl = (
  container,
  data,
  { width = "container", height = "container", background = "transparent" } = {}
) => {
  // get vl spec, and add config
  let vlSpec = JSON.parse(data["vega-lite"]);
  vlSpec.width = width;
  vlSpec.height = height;
  vlSpec.background = background;
  vlSpec["usermeta"] = { embedOptions: { renderer: "svg" } };
  // render
  return vegaEmbed(container.node(), vlSpec).then((result) => {
    const svg = container.select("svg");
    // remove other components and re-insert svg
    container.select("div").remove();
    container.select("details").remove();
    container.node().appendChild(svg.node());
    return svg;
  });
};

export { drawVl };
