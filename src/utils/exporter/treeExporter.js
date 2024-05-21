import { drawVl } from "@/utils/vega_lite/vlDrawer.js";

class PDFGraph {
  constructor(data) {
    this.defaultConfig = {
      // top borders
      iBorderWidth: 450,
      iBorderHeight: 200,
      qBorderWidth: 120,
      qBorderHeight: 200,
      rBorderWidth: 450,
      rBorderHeight: 60,
      // top border general
      borderWidth: 3,
      borderStroke: "#dedede",
      borderR: 10,
      // gap
      borderGap: 300,
      // vega-lite
      vlWidth: 120,
      vlHeight: 120,
      // description
      descWidth: 180,
      descHeight: 250,
      descStrokeWidth: 1.5,
      descBorderR: 6,
      descStroke: "#aaacaf",
      fontSize: 14,
      textColor: "#aaacaf",
      textGap: 5,
      // relType
      angleWidth: 20,
    };
    this.nodeData = data.nodes;
    this.linkData = data.links;
    this.root = this.getTreeStructure();
    const maxWidth = this.getMaxWidth(this.root);
    const maxDepth =
      this.root
        .descendants()
        .reduce((max, node) => Math.max(max, node.depth), 0) + 1;
    this.containerWidth =
      maxWidth *
      (this.defaultConfig.qBorderWidth +
        this.defaultConfig.iBorderWidth +
        this.defaultConfig.borderGap);
    this.containerHeight =
      maxDepth *
      (this.defaultConfig.rBorderHeight +
        this.defaultConfig.iBorderHeight +
        this.defaultConfig.borderGap);
    this.treeWidth = this.containerWidth;
    this.treeHeight =
      this.containerHeight -
      (this.defaultConfig.rBorderHeight +
        this.defaultConfig.iBorderHeight +
        this.defaultConfig.borderGap);
  }

  // use d3.hierarchy to get tree structure
  getTreeStructure() {
    const nodeIdMap = new Map();
    this.nodeData.forEach((node) => {
      node.children = [];
      nodeIdMap.set(node.id, node);
    });

    this.linkData.forEach((link) => {
      const parent = nodeIdMap.get(link.source);
      const child = nodeIdMap.get(link.target);
      // store link data to node
      parent.children.push({
        ...child,
        linkInfo: {
          relType: link.relType,
          question: link.question,
          relationship: link.relationship,
        },
      });
    });
    const root = this.nodeData[0];
    return d3.hierarchy(root);
  }

  // get 'max-width' of tree
  getMaxWidth(root) {
    const levelWidths = [];

    const queue = [{ node: root, level: 0 }];
    while (queue.length > 0) {
      const { node, level } = queue.shift();

      if (levelWidths.length <= level) {
        levelWidths.push(0);
      }
      levelWidths[level]++;
      node.children &&
        node.children.forEach((child) => {
          queue.push({ node: child, level: level + 1 });
        });
    }

    return Math.max(...levelWidths);
  }
  async createGraph(containerNode) {
    const self = this;
    const root = this.root;
    // awaiting for completion of vega-lite drawing
    const promises = [];
    const svg = d3
      .create("svg")
      .attr("width", this.containerWidth)
      .attr("height", this.containerHeight)
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .attr("viewBox", [0, 0, this.containerWidth, this.containerHeight]);
    //   .style("overflow", "visible");

    // config d3.tree layout
    const treeGraph = d3.tree().size([this.treeWidth, this.treeHeight]);

    // apply data into this tree (get x and y for each node)
    treeGraph(root);
    const topGLink = svg.append("g").attr("class", "top-g-link");
    const topGNode = svg.append("g").attr("class", "top-g-node");
    // center the whole graph
    svg
      .selectChildren("g")
      .style(
        "transform",
        `translate(${-this.defaultConfig.iBorderWidth / 2}px, ${0}px)`
      );
    const links = topGLink
      .selectChildren(".link")
      .data(root.links())
      .join((enter) => {
        const linkGs = enter
          .append("g")
          .attr("class", "link")
          .attr("fill", "none");

        //   .attr("stroke", "#555")
        //   .attr("stroke-width", "1.5px");
        //   .attr(
        //     "d",
        //     d3
        //       .linkVertical()
        //       .x((d) => d.x + this.defaultConfig.iBorderWidth / 2)
        //       .y((d) => d.y + this.defaultConfig.iBorderHeight / 2)
        //   );
        linkGs.each(function (d, idx) {
          const g = d3.select(this);

          switch (d.target.data.linkInfo.relType) {
            case "generalization":
              g.append("path")
                .attr("fill", "#aaacaf")
                .attr("d", (d) => {
                  const point1 = [
                    d.target.x + self.defaultConfig.iBorderWidth / 2,
                    d.target.y + self.defaultConfig.iBorderHeight / 2,
                  ];
                  const point2 = [
                    d.source.x + self.defaultConfig.iBorderWidth / 2,
                    d.source.y + self.defaultConfig.iBorderHeight / 2,
                  ];

                  const widthAtStart = 30;
                  const widthAtEnd = 1;

                  const angle = Math.atan2(
                    point2[1] - point1[1],
                    point2[0] - point1[0]
                  );

                  const p1 = [
                    point1[0] + widthAtStart * Math.sin(angle),
                    point1[1] - widthAtStart * Math.cos(angle),
                  ];

                  const p2 = [
                    point1[0] - widthAtStart * Math.sin(angle),
                    point1[1] + widthAtStart * Math.cos(angle),
                  ];

                  const p3 = [
                    point2[0] - widthAtEnd * Math.sin(angle),
                    point2[1] + widthAtEnd * Math.cos(angle),
                  ];

                  const p4 = [
                    point2[0] + widthAtEnd * Math.sin(angle),
                    point2[1] - widthAtEnd * Math.cos(angle),
                  ];

                  return `M${p1} L${p2} L${p3} L${p4} Z`;
                });

              break;
            case "specialization":
              g.append("path")
                .attr("fill", "#aaacaf")
                .attr("d", (d) => {
                  const point1 = [
                    d.source.x + self.defaultConfig.iBorderWidth / 2,
                    d.source.y + self.defaultConfig.iBorderHeight / 2,
                  ];
                  const point2 = [
                    d.target.x + self.defaultConfig.iBorderWidth / 2,
                    d.target.y + self.defaultConfig.iBorderHeight / 2,
                  ];

                  const widthAtStart = 30;
                  const widthAtEnd = 1;

                  const angle = Math.atan2(
                    point2[1] - point1[1],
                    point2[0] - point1[0]
                  );

                  const p1 = [
                    point1[0] + widthAtStart * Math.sin(angle),
                    point1[1] - widthAtStart * Math.cos(angle),
                  ];

                  const p2 = [
                    point1[0] - widthAtStart * Math.sin(angle),
                    point1[1] + widthAtStart * Math.cos(angle),
                  ];

                  const p3 = [
                    point2[0] - widthAtEnd * Math.sin(angle),
                    point2[1] + widthAtEnd * Math.cos(angle),
                  ];

                  const p4 = [
                    point2[0] + widthAtEnd * Math.sin(angle),
                    point2[1] - widthAtEnd * Math.cos(angle),
                  ];

                  return `M${p1} L${p2} L${p3} L${p4} Z`;
                });

              break;
            case "sameLevel":
              g.append("path")
                .attr("stroke", "#aaa")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", 5)
                .attr(
                  "d",
                  d3
                    .linkVertical()
                    .x((d) => d.x + self.defaultConfig.iBorderWidth / 2)
                    .y((d) => d.y + self.defaultConfig.iBorderHeight / 2)
                );
              break;
            default:
              g.append("path")
                .attr("stroke", "#aaa")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", 5)
                .style("stroke-dasharray", "10 5")
                .attr(
                  "d",
                  d3
                    .linkVertical()
                    .x((d) => d.x + self.defaultConfig.iBorderWidth / 2)
                    .y((d) => d.y + self.defaultConfig.iBorderHeight / 2)
                );
          }
        });
      });

    const nodes = topGNode
      .selectChildren(".node")
      .data(root.descendants())
      .join((enter) => {
        const nodeGs = enter
          .append("g")
          .attr("class", "node")
          .style("transform", (d) => `translate(${d.x}px,${d.y}px)`);
        // select nodes which have question and relationship bar
        const nodeGRich = nodeGs.filter((d) => d.data.id !== this.root.data.id);
        // create relationship bar
        const relationship = nodeGRich
          .append("g")
          .attr("class", "relationship")
          .style(
            "transform",
            `translate(${0}px, ${-this.defaultConfig.rBorderHeight}px)`
          );
        const rBorders = relationship
          .append("rect")
          .attr("width", this.defaultConfig.rBorderWidth)
          .attr("height", this.defaultConfig.rBorderHeight)
          .attr("stroke", this.defaultConfig.borderStroke)
          .attr("stroke-width", this.defaultConfig.borderWidth)
          .attr("rx", this.defaultConfig.borderR)
          .attr("fill", "#fff");
        relationship
          .append("foreignObject")
          .attr("width", this.defaultConfig.rBorderWidth)
          .attr("height", this.defaultConfig.rBorderHeight)
          .append("xhtml:div")
          .style("width", `${this.defaultConfig.rBorderWidth}px`)
          .style("height", `${this.defaultConfig.rBorderHeight}px`)
          .style("overflow", "auto")
          .style("font-size", `${this.defaultConfig.fontSize}px`)
          .style("color", this.defaultConfig.textColor)
          .style("padding", `${this.defaultConfig.textGap}px`)
          .style("box-sizing", "border-box")
          .style("white-space", "pre-wrap")
          .text((d) => {
            const title = "Relationship:\n";
            return title + (d.data.linkInfo.relationship || "null");
          });

        // create question bar
        const question = nodeGRich
          .append("g")
          .attr("class", "question")
          .style(
            "transform",
            `translate(${-this.defaultConfig.qBorderWidth}px, ${0}px)`
          );

        const qBorders = question
          .append("rect")
          .attr("width", this.defaultConfig.qBorderWidth)
          .attr("height", this.defaultConfig.qBorderHeight)
          .attr("stroke", this.defaultConfig.borderStroke)
          .attr("stroke-width", this.defaultConfig.borderWidth)
          .attr("rx", this.defaultConfig.borderR)
          .attr("fill", "#fff");

        question
          .append("foreignObject")
          .attr("width", this.defaultConfig.qBorderWidth)
          .attr("height", this.defaultConfig.qBorderHeight)
          .append("xhtml:div")
          .style("width", `${this.defaultConfig.qBorderWidth}px`)
          .style("height", `${this.defaultConfig.qBorderHeight}px`)
          .style("overflow", "auto")
          .style("font-size", `${this.defaultConfig.fontSize}px`)
          .style("color", this.defaultConfig.textColor)
          .style("padding", `${this.defaultConfig.textGap}px`)
          .style("box-sizing", "border-box")
          .style("white-space", "pre-wrap")
          .text((d) => {
            const title = "Question:\n";
            return title + (d.data.linkInfo.question || "NULL");
          });

        const insightNode = nodeGs.append("g").attr("class", "insight");
        const iBorders = insightNode
          .append("rect")
          .attr("width", this.defaultConfig.iBorderWidth)
          .attr("height", this.defaultConfig.iBorderHeight)
          .attr("stroke", this.defaultConfig.borderStroke)
          .attr("stroke-width", this.defaultConfig.borderWidth)
          .attr("rx", this.defaultConfig.borderR)
          .attr("fill", "#fff");

        // draw vegalite graph
        const vlBorders = insightNode
          .append("g")
          .attr("class", "vl-border")
          .style("transform", `translate(${30}px, ${30}px)`);
        vlBorders.each(function (d) {
          const vlContainer = d3.select(this);
          const promise = drawVl(
            vlContainer,
            { vegaLite: d.data.vegaLite },
            {
              width: self.defaultConfig.vlWidth,
              height: self.defaultConfig.vlHeight,
            }
          ).then((svg) => {
            svg.attr("width", self.defaultConfig.iBorderWidth / 2);
          });
          promises.push(promise);
        });
        // draw description
        const descGs = insightNode
          .append("g")
          .attr("class", "desc-g")
          .style(
            "transform",
            `translate(${this.defaultConfig.iBorderWidth / 2 + 30}px, ${30}px)`
          );
        descGs
          .append("foreignObject")
          .attr("width", this.defaultConfig.descWidth)
          .attr("height", this.defaultConfig.descHeight)
          .append("xhtml:div")
          .style("width", `${this.defaultConfig.descWidth}px`)
          .style("height", `${this.defaultConfig.descHeight}px`)
          .style("overflow", "auto")
          .style("font-size", `${this.defaultConfig.fontSize}px`)
          .style("color", this.defaultConfig.textColor)
          .style("padding", `${this.defaultConfig.textGap}px`)
          .style("box-sizing", "border-box")
          .text((d) => d.data.description);
      });

    // containerNode.appendChild(svg.node());
    await Promise.all(promises);
    this.downloadSVG(svg.node(), "story");
  }

  downloadSVG(svgElement, fileName) {
    // Serialize the SVG to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    // Use Blob to create a downloadable file
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });

    // Create a URL and link to download the blob as a file
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    URL.revokeObjectURL(url);
  }
}

export { PDFGraph };
