/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

import { data2 } from "./data";

interface Datum {
  name?: string;
  value?: number;
  children?: Datum[];
}

// Constants for zooming in and out
const ZOOM_FACTOR = 0.2; // Change this to adjust the zoom factor
const MIN_ZOOM_LEVEL = 1;
const MAX_ZOOM_LEVEL = 6;

let threshold: number;

export default function Chart4() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1); // State to manage zoom level

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Color scale
    const color = d3.scaleLinear<number>().domain([0, 5]);
    //   .range(["rgb(102, 204, 153)", "rgb(35, 45, 77)"]);

    const svgIcon = d3.select(svgRef.current);

    const pack = (data: Datum) =>
      d3
        .pack<Datum>()
        .size([width, height])
        .padding(10)(d3.hierarchy(data).sum((d) => d.value ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const root = pack(data2);

    createCircularPacking(root, svgIcon, width, height, color, zoomLevel);
    return () => {
      d3.select("#demo").selectAll("*").remove();
    };
  }, [zoomLevel]);

  const roundedZoomLevel = Math.round(zoomLevel * 10) / 10;

  function increaseZoomLevel() {
    if (roundedZoomLevel + ZOOM_FACTOR <= MAX_ZOOM_LEVEL) {
      setZoomLevel(roundedZoomLevel + ZOOM_FACTOR);
    }
  }

  function decreaseZoomLevel() {
    if (roundedZoomLevel - ZOOM_FACTOR >= MIN_ZOOM_LEVEL) {
      setZoomLevel(roundedZoomLevel - ZOOM_FACTOR);
    }
  }

  return (
    <>
      <div>
        <svg ref={svgRef} id="demo"></svg>
      </div>

      <div className="btns">
        <button onClick={increaseZoomLevel}>+</button>
        <button onClick={decreaseZoomLevel}>-</button>
      </div>
    </>
  );
}

function createCircularPacking(
  root: d3.HierarchyCircularNode<Datum>, // Add the type argument 'Datum'
  svgIcon: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
  width: number,
  height: number,
  color: d3.ScaleLinear<number, number, never>,
  zoomLevel: number
) {
  const svg = svgIcon
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr(
      "style",
      `max-width: 100%; height: auto; display: block; margin: 0 0px; background: ${color(
        0
      )}; border: 1px solid #000;`
    );

  const node = svg
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
    .attr("fill", (d) => (d.children ? "rgba(66, 84, 251, 0.19)" : "white"))
    .attr("filter", "drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4)")
    .attr("pointer-events", (d) => (!d.children ? "none" : "none"))
    .on("mouseover", function () {
      d3.select(this).attr("stroke", "#000");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", null);
    })
    .style("border", "1px solid red");

  const label = svg
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .style("font", "10px sans-serif")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
    .style("display", (d) => (d.parent === root ? "inline" : "none"))
    .text((d) => d.data.name ?? "");

  // svg.on("click", (event) => zoom(event, root));
  let focus = root;
  let view: any;
  zoomTo([root.x, root.y, root.r * 2]);
  // console.log("threshold", threshold);

  function zoomTo(v: any) {
    const k = (Math.min(width, height) / v[2]) * zoomLevel;
    // console.log("k", k);
    // const roundedK = Math.round(k * 10) / 10; // Round to two decimal places
    // console.log("roundedk", roundedK);
    threshold = k;
    view = v;

    label.attr(
      "transform",
      (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    node.attr(
      "transform",
      (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    node.attr("r", (d) => d.r * k);

    // updateLabelVisibility();
  }

  // function updateLabelVisibility() {
  // label
  //   .style("display", function (d) {
  //     return threshold > 2 || d.parent === root ? "inline" : "none";
  //   })
  //   .transition()
  //   .style("fill-opacity", function (d) {
  //     if (d.parent === root && threshold <= 2) return 1;
  //     if (d.parent !== root && threshold > 2) return 1;
  //     return 0;
  //   });

  // label
  //   .style("display", function (d) {
  //     return threshold > 2 || d.parent === root ? "inline" : "none";
  //   })
  //   .transition()
  //   .style("fill-opacity", function (d) {
  //     return threshold > 2 || d.parent === root ? 1 : 0;
  //   });
  // }

  // d3.selectAll(".btns button").on("click", updateLabelVisibility);

  // function updateLabelVisibility() {
  // label
  //   .style("display", function (d) {
  //     return threshold > 2 || d.parent === root ? "inline" : "none";
  //   })
  //   .transition()
  //   .style("fill-opacity", function (d) {
  //     return threshold > 2 || d.parent === root ? 1 : 0;
  //   });
  // label
  //   .filter(function (d) {
  //     return (
  //       threshold > 2 || (this as SVGTextElement)?.style.display === "inline"
  //     );
  //   })
  //   .transition()
  //   .style("fill-opacity", function (d) {
  //     return threshold > 2 || d.parent === focus ? 1 : 0;
  //   })
  //   .on("start", function () {
  //     if (threshold > 2) (this as SVGTextElement).style.display = "inline";
  //   })
  //   .on("end", function () {
  //     if (threshold > 2) (this as SVGTextElement).style.display = "none";
  //   });
  // }

  // label
  //   .filter(function () {
  //     return (
  //       threshold > 2 || (this as SVGTextElement)?.style.display === "inline"
  //     );
  //   })
  //   .transition()
  //   .style("fill-opacity", () => (threshold > 2 ? 1 : 0))
  //   .on("start", function () {
  //     if (threshold > 2) (this as SVGTextElement).style.display = "inline";
  //   })
  //   .on("end", function () {
  //     if (threshold > 2) (this as SVGTextElement).style.display = "none";
  //   });
}
