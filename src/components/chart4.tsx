/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

import { data2 } from "./data";

interface Datum {
  data: any;
  name?: string;
  value?: number;
  type?: string;
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

    const svgIcon = d3.select(svgRef.current);

    const hierarchy = d3
      .hierarchy(data2)
      .sum((d) => d.value!)
      .sort((a, b) => b.value! - a.value!);

    const pack = (data: Datum) =>
      d3
        .pack<Datum>()
        .size([width, height])
        .padding(5)(d3.hierarchy(data).sum((d) => d.value ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const root = pack(hierarchy);

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

  return (
    <>
      <div id="svgCon" className="svgCon">
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
  svgIcon: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
  width: number,
  height: number,
  color: d3.ScaleLinear<number, number, never>,
  zoomLevel: number,
  isDraggingEnabled = false
) {
  let focus = root;
  let view: any = [root.x, root.y, root.r * 2];

  const svg = svgIcon
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr(
      "style",
      `display: flex; margin: 0; background: red; border: 3px solid yellow;`
    )
    .style("background", "red");

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  createParentNodes(root, g, view);
  createChildrenNodes(root, g, view);

  function zoomTo(v: any) {
    const k = (Math.min(width, height) / v[2]) * zoomLevel;
    threshold = k;

    const tx = width / 2 - v[0] * k;
    const ty = height / 2 - v[1] * k;

    g.attr("transform", `translate(${tx},${ty}) scale(${k})`);
  }

  function getCurrentTransform() {
    const currentTransform = g.attr("transform") || "translate(0,0) scale(1)";
    const translate = currentTransform.match(/translate\(([^)]+)\)/);
    const scale = currentTransform.match(/scale\(([^)]+)\)/);
    const [cx, cy] = translate ? translate[1].split(",").map(Number) : [0, 0];
    const k = scale ? parseFloat(scale[1]) : 1;
    return { cx, cy, k };
  }

  if (isDraggingEnabled && zoomLevel > 1) {
    const drag = d3.drag<SVGElement, unknown>().on("drag", (event) => {
      const dx = event.dx;
      const dy = event.dy;
      const { cx, cy, k } = getCurrentTransform();

      let newCx = cx + dx;
      let newCy = cy + dy;

      // Calculate the maximum allowable translations
      const maxTranslateX = (width / 2) * threshold;
      const maxTranslateY = (height / 2) * threshold;

      // Constrain the new translations within the bounds
      // width and height are to regulate the space between the edge of the svg and the edge of the screen
      newCx = Math.max(-maxTranslateX + width, Math.min(newCx, maxTranslateX));
      newCy = Math.max(-maxTranslateY + height, Math.min(newCy, maxTranslateY));

      g.attr("transform", `translate(${newCx}, ${newCy}) scale(${k})`);
      svg.style("cursor", "grab");
    });

    svg.call(drag as any);
  } else {
    svg.on(".drag", null);
  }

  // Calculate initial view based on current transform
  const initialTransform = getCurrentTransform();
  view = [
    (width / 2 - initialTransform.cx) / initialTransform.k,
    (height / 2 - initialTransform.cy) / initialTransform.k,
    root.r * 2,
  ];

  zoomTo(view);
}

function createChildrenNodes(
  root: d3.HierarchyCircularNode<Datum>,
  g: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  view: any
) {
  const childrenGroup = g.append("g").attr("class", "children");

  const childrenNodes = childrenGroup
    .selectAll("circle")
    .data(root.descendants().filter((d) => !d.children))
    .join("circle")
    .attr(
      "fill",
      threshold > 1.5 ? "rgba(66, 84, 251, 0.19)" : "rgba(66, 84, 251, 0)"
    )
    .attr("filter", "drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4)")
    .attr("pointer-events", "none")
    .attr("r", (d) => d.r)
    .attr("transform", (d) => `translate(${d.x - view[0]},${d.y - view[1]})`);

  const childrenLabels = childrenGroup
    .selectAll("text")
    .data(root.descendants().filter((d) => !d.children))
    .join("text")
    .attr(
      "transform",
      (d) => `translate(${d.x - view[0]},${d.y - view[1] + d.r * 0.15})`
    )
    .attr("dy", "0.3em")
    .style("font", "8px sans-serif")
    .style("text-anchor", "middle")
    .text((d) => d.data.data.name ?? "")
    .style("fill-opacity", 1);

  const childrenType = childrenGroup
    .append("g")
    .selectAll("text")
    .data(root.descendants().filter((d) => !d.children))
    .join("text")
    .attr(
      "transform",
      (d) => `translate(${d.x - view[0]},${d.y - view[1] + d.r * -0.2})`
    )
    .attr("dy", "0.3em")
    .style("font", "8px sans-serif")
    .style("text-anchor", "middle")
    .text((d) => d.data.data.type ?? "")
    .style("fill-opacity", 1);
}

function createParentNodes(
  root: d3.HierarchyCircularNode<Datum>,
  g: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  view: any
) {
  const parentsGroup = g.append("g").attr("class", "parents");

  const parentNodes = parentsGroup
    .selectAll("circle")
    .data(root.descendants().filter((d) => d.children))
    .join("circle")
    .attr("fill", "rgba(66, 84, 251, 0.05)")
    .attr("filter", "drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4)")
    .attr("pointer-events", "none")
    .attr("r", (d) => d.r)
    .attr("transform", (d) => `translate(${d.x - view[0]},${d.y - view[1]})`);

  const parentLabels = parentsGroup
    .selectAll("text")
    .data(root.descendants().filter((d) => d.children))
    .join("text")
    .attr(
      "transform",
      (d) => `translate(${d.x - view[0]},${d.y - view[1] + d.r + 10})`
    )
    .attr("dy", "0.3em")
    .style("font", "8px sans-serif")
    .style("text-anchor", "middle")
    .style("fill-opacity", 1)
    .style("fill", "blue")
    .text((d) => d.data.name ?? "");
}
