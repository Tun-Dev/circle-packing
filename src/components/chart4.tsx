/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import { Children, useEffect, useMemo, useRef, useState } from "react";

import { data2 } from "./data";

interface Datum {
  data?: any;
  name?: string;
  value?: number;
  type?: string;
  children?: Datum[];
}

// Constants for zooming in and out
// const ZOOM_FACTOR = 0.2; // Change this to adjust the zoom factor
const MIN_ZOOM_LEVEL = 1;
const MAX_ZOOM_LEVEL = 15;

let threshold: number;

const sizes = [10, 20];
const names = ["EC2", "EKS"];

function getRandomElement(array: any[]) {
  const randomIndex = Math.floor(Math.random() * array.length);
  const randomElement = array[randomIndex];
  return randomElement;
}

export default function Chart4() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<Datum | null>({
    name: "root",
    children: [
      {
        name: "datafy-api-gateway",
        value: 10,
        type: getRandomElement(names),
      },
    ],
  });
  const [items, setItems] = useState(0);
  const [groups, setGroups] = useState(0);
  const itemsRef = useRef<HTMLInputElement>(null);
  const groupsRef = useRef<HTMLInputElement>(null);
  // const [isPanningEnabled, setIsPanningEnabled] = useState(false);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Color scale
    const color = d3.scaleLinear<number>().domain([0, 5]);

    // const svgIcon = d3.select(svgRef.current);
    const svgIcon = d3.select("#demo");

    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const pack = (data: Datum) =>
      d3
        .pack<Datum>()
        .size([width, height])
        .padding(10)(d3.hierarchy(data).sum((d) => d.value ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const root = pack(hierarchy);

    createCircularPacking(root, svgIcon, width, height, color);
    return () => {
      svgIcon.selectAll("*").remove(); // Clear the SVG contents
    };
  }, [data]);

  const onClickSingle = () => {
    const singleData = {
      name: "datafy-api-gateway",
      value: getRandomElement(sizes),
      type: getRandomElement(names),
    };

    setData((prevData) => {
      if (!prevData?.children) {
        return {
          ...prevData,
          children: [singleData],
        };
      }
      return {
        ...prevData,
        children: [...prevData.children, singleData],
      };
    });
  };

  const onClickGroup = () => {
    const newGroups: any[] = [];

    for (let g = 0; g < groups; g++) {
      const groupData = {
        name: "datafy-api-gateway",
        children: [] as Datum[],
      };

      for (let i = 0; i < items; i++) {
        const singleData = {
          name: "datafy-api-gateway",
          value: getRandomElement(sizes),
          type: getRandomElement(names),
        };
        groupData.children.push(singleData);
      }

      newGroups.push(groupData);
    }

    setData((prevData) => {
      if (!prevData?.children) {
        return {
          ...prevData,
          children: newGroups,
        };
      }
      return {
        ...prevData,
        children: [...prevData.children, ...newGroups],
      };
    });

    setGroups(0);
    setItems(0);
    if (groupsRef.current) {
      groupsRef.current.value = "";
    }
    if (itemsRef.current) {
      itemsRef.current.value = "";
    }
  };

  const onReset = () => {
    setGroups(0);
    setItems(0);
    setData({
      name: "root",
      children: [
        {
          name: "datafy-api-gateway",
          value: 10,
          type: getRandomElement(names),
        },
      ],
    });
    if (itemsRef.current) {
      (itemsRef.current as HTMLInputElement).value = "";
    }
  };

  return (
    <>
      <div id="svgCon" className="svgCon">
        <svg ref={svgRef} id="demo"></svg>
      </div>

      <div className="btns">
        <div className="group1">
          <button id="increaseBtn" onClick={() => {}}>
            +
          </button>
          <button id="decreaseBtn" onClick={() => {}}>
            -
          </button>
        </div>
        <div className="group2">
          {/* <button className="dragBtn" onClick={() => {}}>
            Drag
          </button> */}
        </div>
      </div>

      <div className="floatform">
        <button onClick={onClickSingle}>Add single data</button>
        <div className="form">
          <div className="form__left">
            <label htmlFor="groups">Number of groups:</label>
            <input
              id="groups"
              type="text"
              onChange={(e) => setGroups(Number(e.target.value))}
              ref={groupsRef}
            />
            <label htmlFor="items">Number of items:</label>
            <input
              id="items"
              type="text"
              onChange={(e) => setItems(Number(e.target.value))}
              ref={itemsRef}
            />
          </div>
          <button onClick={onClickGroup}>Add Group</button>
        </div>
        <button onClick={onReset}>Reset</button>
      </div>
    </>
  );
}

function createCircularPacking(
  root: d3.HierarchyCircularNode<Datum>, // Add the type argument 'Datum'
  svgIcon: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  width: number,
  height: number,
  color: d3.ScaleLinear<number, number, never>
  // isPanningEnabled: boolean
) {
  const view: any = [root.x, root.y, root.r * 2];
  // let threshold = 1;

  const zoom = d3
    .zoom()
    .scaleExtent([MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL])
    .translateExtent([
      [-width / 2, -height / 2], // Minimum translation (top-left corner)
      [width / 2, height / 2], // Maximum translation (bottom-right corner)
    ])
    .on("zoom", handleZoom);

  console.log();

  const svg = svgIcon
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr(
      "style",
      `display: flex; margin: 0; background: #F6F8FE; border: 0px solid yellow;`
    )
    .call(zoom as any);

  const g = svg
    .append("g")
    .attr("id", "zoomable")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  // Set the initial zoom transform to center the root
  svg.call(
    zoom.transform as any,
    d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
  );

  d3.select("#increaseBtn").on("click", () => {
    svg.transition().call(zoom.scaleBy as any, 1.2);
  });

  d3.select("#decreaseBtn").on("click", () => {
    svg.transition().call(zoom.scaleBy as any, 0.7);
  });

  createParentNodes(root, g, view);
  createChildrenNodes(root, g, view);

  function handleZoom(e: any) {
    g.attr("transform", e.transform);
    updateChildrenNodes(root, g, e.transform);
  }
}

function createChildrenNodes(
  root: d3.HierarchyCircularNode<Datum>,
  g: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  view: any
) {
  const childrenGroup = g.append("g").attr("class", "children");

  console.log("threshold", threshold);

  const childrenNodes = childrenGroup
    .selectAll("circle")
    .data(root.descendants().filter((d) => !d.children))
    .join("circle")
    .attr("class", "child-node")
    .attr(
      "fill",
      threshold > 1.5 ? "rgba(66, 84, 251, 0.19)" : "rgba(66, 84, 251, 0)"
    )
    .attr("filter", "drop-shadow(0px 0px 0px 10px  rgb(0 0 0 / 1)")
    .attr("pointer-events", "none")
    .attr("r", (d) => d.r)
    .attr("transform", (d) => `translate(${d.x - view[0]},${d.y - view[1]})`);

  addDropShadowFilter(childrenNodes, "drop-shadow");

  const childrenLabels = childrenGroup
    .selectAll("text")
    .data(root.descendants().filter((d) => !d.children))
    .join("text")
    .attr("class", "child-label")
    .attr(
      "transform",
      (d) => `translate(${d.x - view[0]},${d.y - view[1] + d.r * 0.15})`
    )
    .attr("dy", "0.3em")
    .style("font-family", "sans-serif")
    .style("font-size", (d) => `${d.r * 0.2}px`)
    .style("fill", "rgb(92,99,128)")
    .style("text-anchor", "middle")
    .text((d) => d.data.data.name ?? "")
    .style("fill-opacity", 1);

  const childrenTypeBox = childrenGroup
    .append("g")
    .selectAll("rect")
    .data(root.descendants().filter((d) => !d.children))
    .join("rect")
    .attr("class", "child-type-box")
    .attr("rx", 2)
    .attr("ry", 2)
    .style("fill", (d) =>
      d.data.data.type === "EC2"
        ? "rgba(37, 207,119, 0.3)"
        : "rgba(255,241,189,1)"
    )
    .style("fill-opacity", 1)
    .attr(
      "transform",
      (d) => `translate(${d.x - view[0]},${d.y - view[1] + d.r * -0.2})`
    );

  // Add the text elements
  const childrenType = childrenGroup
    .append("g")
    .selectAll("text")
    .data(root.descendants().filter((d) => !d.children))
    .join("text")
    .attr("class", "child-type")
    .attr(
      "transform",
      (d) => `translate(${d.x - view[0]},${d.y - view[1] + d.r * -0.2})`
    )
    .attr("dy", "0.3em")
    .style("font-family", "Arial, sans-serif")
    .style("font-size", (d) => `${d.r * 0.15}px`)
    .style("fill", (d) =>
      d.data.data.type === "EC2" ? "rgba(24, 146,77, 1)" : "rgba(239,153,70,1)"
    )
    .style("text-anchor", "middle")
    .text((d) => d.data.data.type ?? "")
    .style("fill-opacity", 1);

  childrenType.each(function (d, i) {
    const bbox = (this as SVGTextElement).getBBox();
    d3.select(childrenTypeBox.nodes()[i])
      .attr("x", bbox.x - 3) // Adjust x position for padding
      .attr("y", bbox.y - 3) // Adjust y position for padding
      .attr("width", bbox.width + 6) // Adjust width for padding
      .attr("height", bbox.height + 6); // Adjust height for padding
  });

  childrenType.raise();
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

function updateChildrenNodes(
  root: d3.HierarchyCircularNode<Datum>,
  g: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  view: any
) {
  // console.log("view", view);
  const childrenGroup = g.select(".children");

  childrenGroup
    .selectAll(".child-node")
    .data(root.descendants().filter((d) => !d.children))
    .attr(
      "fill",
      view.k > 1.5 ? "rgba(255, 255, 255, 1)" : "rgba(66, 84, 251, 0)"
    )
    .attr("filter", view.k > 1.5 ? "url(#drop-shadow)" : "none");
}

function addDropShadowFilter(svg: any, filterId: string) {
  const defs = svg.append("defs");

  const filter = defs
    .append("filter")
    .attr("id", filterId)
    .attr("width", "200%") // Increase the width of the filter region
    .attr("height", "200%"); // Increase the height of the filter region

  filter
    .append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 5); // Adjust the blur amount for a bigger shadow

  filter
    .append("feOffset")
    .attr("dx", 0) // Horizontal offset of the shadow
    .attr("dy", 0) // Vertical offset of the shadow
    .attr("result", "offsetblur");

  filter.append("feFlood").attr("flood-color", "rgba(0, 0, 0, 0.2)"); // Color and opacity of the shadow

  filter.append("feComposite").attr("in2", "offsetblur").attr("operator", "in");

  const feMerge = filter.append("feMerge");

  feMerge.append("feMergeNode");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");
}
