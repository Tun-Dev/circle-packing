/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

import { data2 } from "./data";

interface Datum {
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
    //   .range(["rgb(102, 204, 153)", "rgb(35, 45, 77)"]);

    // const svgIcon = d3.select(svgRef.current);
    const svgIcon = d3.select("#demo");

    const pack = (data: Datum) =>
      d3
        .pack<Datum>()
        .size([width, height])
        .padding(20)(d3.hierarchy(data).sum((d) => d.value ?? 0))
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
  svgIcon: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  width: number,
  height: number,
  color: d3.ScaleLinear<number, number, never>,
  zoomLevel: number,
  isDraggingEnabled = false
) {
  // console.log(root);
  let focus = root;
  // let view: any;
  // zoomTo([root.x, root.y, root.r * 2]);
  let view: any = [root.x, root.y, root.r * 2];
  // let newView: any;
  // let newTransform: any;

  const svg = svgIcon
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr(
      "style",
      ` display: block; margin: 0 0px; background: ${color(
        0
      )}; border: 3px solid red; overflow: hidden;`
    );

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .attr("outline", "3px solid red");

  createParentNodes(root, g, view);
  createChildrenNodes(root, g, view);

  // svg.on("click", (event) => zoom(event, root));
  // console.log("threshold", threshold);

  function zoomTo(v: any) {
    const k = (Math.min(width, height) / v[2]) * zoomLevel;
    // console.log(k);

    threshold = k;
    // view = v;
    // v = view;
    // console.log("zoom view", view, "zoom v", v);

    const tx = width - v[0];
    const ty = height - v[1];

    g.attr("transform", `translate(${tx},${ty}) scale(${k}) `);

    // console.log(g.node()?.getBBox());
  }

  if (isDraggingEnabled && zoomLevel > 1) {
    const drag = d3.drag<SVGElement, unknown>().on("drag", (event) => {
      const dx = event.dx;
      const dy = event.dy;
      const currentTransform = g.attr("transform") || "translate(0,0)";
      const translate = currentTransform.match(/translate\(([^)]+)\)/);
      const [cx, cy] = translate ? translate[1].split(",").map(Number) : [0, 0];
      g.attr(
        "transform",
        `translate(${cx + dx},${cy + dy}) scale(${threshold})`
      );

      svg.attr("style", "cursor: grab;");

      view[0] -= dx / threshold;
      view[1] -= dy / threshold;
    });

    svg.call(drag as any); // Add a type assertion to 'any' to bypass the type mismatch.
  } else {
    svg.on(".drag", null); // Disable drag if dragging is not enabled
  }

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
    .text((d) => d.data.name ?? "")
    .style("fill-opacity", 1); // Initially set opacity to 0
  // .style("fill-opacity", () => (threshold < 1.5 ? 0 : 1)) // Initially set opacity to 0
  // .style("fill-opacity", () => (threshold > 1.5 ? 1 : 0));

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
    .text((d) => d.data.type ?? "")
    .style("fill-opacity", 1); // Initially set opacity to 0
}

function createParentNodes(
  root: d3.HierarchyCircularNode<Datum>,
  g: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  view: any
) {
  const parentsGroup = g.append("g").attr("class", "parents");

  const parentNodes = parentsGroup
    .selectAll("circle")
    .data(
      root
        .descendants()
        .slice(1)
        .filter((d) => d.children)
    )
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
