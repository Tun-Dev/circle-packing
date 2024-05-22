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
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false);

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

    createCircularPacking(
      root,
      svgIcon,
      width,
      height,
      color,
      zoomLevel,
      isDraggingEnabled
    );
    return () => {
      // d3.select("#demo").selectAll("*").remove();
      svgIcon.selectAll("*").remove(); // Clear the SVG contents
    };
  }, [zoomLevel, isDraggingEnabled]);

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

  function toggleDragging() {
    setIsDraggingEnabled((prev) => !prev);
  }

  // useEffect(() => {
  //   console.log("isDraggingEnabled", isDraggingEnabled);
  // }, [isDraggingEnabled]);

  return (
    <>
      <div>
        <svg ref={svgRef} id="demo"></svg>
      </div>

      <div className="btns">
        <div className="group1">
          <button onClick={increaseZoomLevel}>+</button>
          <button onClick={decreaseZoomLevel}>-</button>
        </div>
        <div className="group2">
          <button className="dragBtn" onClick={toggleDragging}>
            Drag
          </button>
        </div>
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
  zoomLevel: number,
  isDraggingEnabled = false
) {
  const svg = svgIcon
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr(
      "style",
      `max-width: 100%; height: auto; display: block; margin: 0 0px; background: ${color(
        0
      )}; border: 1px solid #000; overflow: hidden;`
    );

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const node = g
    .selectAll("circle")
    .data(root.descendants())
    .join("circle")
    .attr("fill", (d) => (d.children ? "rgba(66, 84, 251, 0.19)" : "white"))
    .attr("filter", "drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4)")
    .attr("pointer-events", (d) => (!d.children ? "none" : "none"))
    .on("mouseover", function () {
      d3.select(this).attr("stroke", "#000");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", null);
    });

  // const label = svg
  //   .append("g")
  //   .attr("transform", `translate(${width / 2},${height / 2})`)
  //   .style("font", "10px sans-serif")
  //   .attr("pointer-events", "none")
  //   .attr("text-anchor", "middle")
  //   .selectAll("text")
  //   .data(root.descendants())
  //   .join("text")
  //   .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
  //   .style("display", (d) => (d.parent === root ? "inline" : "none"))
  //   .text((d) => d.data.name ?? "");

  // svg.on("click", (event) => zoom(event, root));
  console.log(root);
  let focus = root;
  // let view: any;
  // zoomTo([root.x, root.y, root.r * 2]);
  let view: any = [root.x, root.y, root.r * 2];
  zoomTo(view);
  // console.log("threshold", threshold);

  function zoomTo(v: any) {
    const k = (Math.min(width, height) / v[2]) * zoomLevel;
    console.log(v);

    threshold = k;
    view = v;
    // v = view;

    // console.log("v", v[0], v[1], v[2]);

    // label.attr(
    //   "transform",
    //   (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    // );
    node.attr(
      "transform",
      (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    node.attr("r", (d) => d.r * k);
  }

  if (isDraggingEnabled && zoomLevel > 1) {
    const drag = d3.drag<SVGElement, unknown>().on("drag", (event) => {
      // console.log("dragging");
      const dx = event.dx;
      const dy = event.dy;
      const currentTransform = g.attr("transform") || "translate(0,0)";
      const translate = currentTransform.match(/translate\(([^)]+)\)/);
      const [cx, cy] = translate ? translate[1].split(",").map(Number) : [0, 0];
      g.attr("transform", `translate(${cx + dx},${cy + dy})`);
      svg.attr("style", "cursor: grab;");

      view[0] -= dx;
      view[1] -= dy;
    });
    svg.call(drag as any); // Add a type assertion to 'any' to bypass the type mismatch.
  } else {
    svg.on(".drag", null); // Disable drag if dragging is not enabled
  }
}
