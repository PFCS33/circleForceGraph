import { drawVl } from "@/utils/vega_lite/vlDrawer.js";
import { jsPDF } from "jspdf";
import * as svg2pdf from "svg2pdf.js";
class PDFGraph {
  constructor(pathData) {
    this.insightData = pathData.insightData;
    this.relaData = pathData.relaData;
    this.questionData = pathData.questionData;
    this.relTypeData = pathData.relTypeData;

    this.defaultConfig = {
      // top borders
      iBorderWidth: 450,
      iBorderHeight: 200,
      qBorderWidth: 250,
      qBorderHeight: 100,
      rBorderWidth: 250,
      rBorderHeight: 100,
      // top border general
      borderWidth: 3,
      borderStroke: "#dedede",
      borderR: 10,
      // gap
      borderGap: 100,
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
    this.containerWidth = 1000;
    this.containerHeight =
      pathData.insightData.length *
      (this.defaultConfig.iBorderHeight + this.defaultConfig.borderGap);
  }

  async createGraph() {
    const self = this;
    const promises = [];
    const svg = d3
      .create("svg")
      .attr("width", this.containerWidth)
      .attr("height", this.containerHeight)
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .attr("viewBox", [0, 0, this.containerWidth, this.containerHeight])
      .style("overflow", "visible");

    const insightTopG = svg.append("g").attr("class", "topg-insight");
    const questionTopG = svg.append("g").attr("class", "topg-question");
    const relaTopG = svg.append("g").attr("class", "topg-rela");
    const linkTopG = svg.append("g").attr("class", "topg-link");
    const bgTopG = svg.append("g").attr("class", "topg-bg");

    insightTopG
      .selectChildren("g")
      .data(this.insightData, (d) => "i-" + d.id)
      .join((enter) => {
        const nodeGs = enter
          .append("g")
          .style(
            "transform",
            (d, idx) =>
              `translate(${
                (this.containerWidth - this.defaultConfig.iBorderWidth) / 2
              }px, ${
                idx *
                (this.defaultConfig.borderGap +
                  this.defaultConfig.iBorderHeight)
              }px)`
          );
        // topBorder
        const iBorders = nodeGs
          .append("rect")
          .attr("width", this.defaultConfig.iBorderWidth)
          .attr("height", this.defaultConfig.iBorderHeight)
          .attr("stroke", this.defaultConfig.borderStroke)
          .attr("stroke-width", this.defaultConfig.borderWidth)
          .attr("rx", this.defaultConfig.borderR)
          .attr("fill", "#fff");

        // draw vegalite graph
        const vlBorders = nodeGs
          .append("g")
          .attr("class", "vl-border")
          .style("transform", `translate(${30}px, ${30}px)`);
        vlBorders.each(function (d) {
          const vlContainer = d3.select(this);
          const promise = drawVl(
            vlContainer,
            { vegaLite: d.vegaLite },
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
        const descGs = nodeGs
          .append("g")
          .attr("class", "desc-g")
          .style(
            "transform",
            `translate(${this.defaultConfig.iBorderWidth / 2 + 30}px, ${30}px)`
          );
        // const descBorders = descGs
        //   .append("rect")
        //   .attr("width", this.defaultConfig.descWidth)
        //   .attr("height", this.defaultConfig.descHeight)
        //   .attr("stroke", this.defaultConfig.descStroke)
        //   .attr("stroke-width", this.defaultConfig.descStrokeWidth)
        //   .attr("rx", this.defaultConfig.descBorderR)
        //   .attr("fill", "#fff");
        // Add text within the rect
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
          .text((d) => d.description);
      });

    questionTopG
      .selectChildren("g")
      .data(this.questionData, (d) => "q-" + d.id)
      .join((enter) => {
        const nodeGs = enter
          .append("g")
          .style(
            "transform",
            (d, idx) =>
              `translate(${0}px, ${
                this.defaultConfig.iBorderHeight +
                idx *
                  (this.defaultConfig.borderGap +
                    this.defaultConfig.iBorderHeight)
              }px)`
          )
          .style("display", (d) =>
            d.question && d.question !== "" ? null : "none"
          );
        const qBorders = nodeGs
          .append("rect")
          .attr("width", this.defaultConfig.qBorderWidth)
          .attr("height", this.defaultConfig.qBorderHeight)
          .attr("stroke", this.defaultConfig.borderStroke)
          .attr("stroke-width", this.defaultConfig.borderWidth)
          .attr("rx", this.defaultConfig.borderR)
          .attr("fill", "#fff");
        nodeGs
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
          .text((d) => d.question);
      });

    relaTopG
      .selectChildren("g")
      .data(this.relaData, (d) => "r-" + d.id)
      .join((enter) => {
        const nodeGs = enter
          .append("g")
          .style(
            "transform",
            (d, idx) =>
              `translate(${
                this.containerWidth - this.defaultConfig.rBorderWidth
              }px, ${
                this.defaultConfig.iBorderHeight +
                idx *
                  (this.defaultConfig.borderGap +
                    this.defaultConfig.iBorderHeight)
              }px)`
          )
          .style("display", (d) =>
            d.relationship && d.relationship !== "" ? null : "none"
          );
        const qBorders = nodeGs
          .append("rect")
          .attr("width", this.defaultConfig.qBorderWidth)
          .attr("height", this.defaultConfig.qBorderHeight)
          .attr("stroke", this.defaultConfig.borderStroke)
          .attr("stroke-width", this.defaultConfig.borderWidth)
          .attr("rx", this.defaultConfig.borderR)
          .attr("fill", "#fff");
        nodeGs
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
          .text((d) => d.relationship);
      });
    linkTopG
      .selectChildren("g")
      .data(this.relTypeData, (d) => "l-" + d.id)
      .join((enter) => {
        const linkGs = enter
          .append("g")
          .style(
            "transform",
            (d, idx) =>
              `translate(${this.containerWidth / 2}px, ${
                this.defaultConfig.iBorderHeight +
                idx *
                  (this.defaultConfig.borderGap +
                    this.defaultConfig.iBorderHeight)
              }px)`
          );
        linkGs.each(function (d, idx) {
          const g = d3.select(this);
          switch (d.relType) {
            case "generalization":
              g.append("path")
                .attr(
                  "d",
                  `M 0 0 L ${self.defaultConfig.angleWidth / 2} ${
                    self.defaultConfig.borderGap
                  } L ${-self.defaultConfig.angleWidth / 2} ${
                    self.defaultConfig.borderGap
                  } Z`
                )
                .attr("fill", "#aaacaf");
              break;
            case "specialization":
              g.append("path")
                .attr(
                  "d",
                  `M 0 ${self.defaultConfig.borderGap} L ${
                    self.defaultConfig.angleWidth / 2
                  } 0 L ${-self.defaultConfig.angleWidth / 2} 0 Z`
                )
                .attr("fill", "#aaacaf");
              break;
            case "sameLevel":
              g.append("line")
                .attr("stroke", "#aaa")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", 5)
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 0)
                .attr("y2", self.defaultConfig.borderGap);
              break;
            default:
              g.append("line")
                .attr("stroke", "#aaa")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", 5)
                .style("stroke-dasharray", "10 5")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 0)
                .attr("y2", self.defaultConfig.borderGap);
          }
        });
      });

    bgTopG
      .append("text")
      .text("Questions")
      .style("font-size", "30px")
      .style("font-weight", 800)
      .style("fill", "#aaacaf")
      .style(
        "transform",
        `translate(${this.defaultConfig.rBorderWidth / 2 - 60}px, ${30}px)`
      );
    bgTopG
      .append("text")
      .text("relationship")
      .style("font-size", "30px")
      .style("font-weight", 800)
      .style("fill", "#aaacaf")
      .style(
        "transform",
        `translate(${
          this.containerWidth - this.defaultConfig.qBorderWidth / 2 - 60
        }px, ${30}px)`
      );
    await Promise.all(promises);
    // // turn svg into string
    // const svgString = new XMLSerializer().serializeToString(svg.node());
    // const parser = new DOMParser();
    // const parsedSvg = parser.parseFromString(
    //   svgString,
    //   "image/svg+xml"
    // ).documentElement;

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

  async downloadPDF(svgElement) {
    const svgWidth = this.containerWidth;
    const svgHeight = this.containerHeight;

    const pdfWidth = svgWidth;
    const pdfHeight = 800;

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [pdfWidth, pdfHeight],
    });

    let yOffset = 0;

    // 将 SVG 分割成多页
    while (yOffset < svgHeight) {
      await svg2pdf.svg2pdf(svgElement, pdf, {
        x: (pdfWidth - svgWidth) / 2,
        y: -yOffset,
        width: svgWidth,
        height: svgHeight,
      });

      yOffset += pdfHeight;

      if (yOffset < svgHeight) {
        pdf.addPage();
      }
    }

    pdf.save("download.pdf");
  }
}

export { PDFGraph };
