/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

// import { data2 } from "./data";

interface Datum {
  data?: any;
  name?: string;
  value?: number;
  type?: string;
  children?: Datum[];
}

const MIN_ZOOM_LEVEL = 1;
const MAX_ZOOM_LEVEL = 20;

const sizes = [10, 20];
const names = ["EC2", "EKS"];

function getRandomElement(array: any[]) {
  const randomIndex = Math.floor(Math.random() * array.length);
  const randomElement = array[randomIndex];
  return randomElement;
}

export default function Chart6() {
  const [data, setData] = useState<Datum | null>({
    name: "root",
    children: [
      //   {
      //     name: "datafy-api-gateway",
      //     value: getRandomElement(sizes),
      //     type: getRandomElement(names),
      //   },
    ],
  });
  const [items, setItems] = useState(0);
  const [groups, setGroups] = useState(0);
  const [singleData, setSingleData] = useState(0);
  const itemsRef = useRef<HTMLInputElement>(null);
  const groupsRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const chartElement = document.getElementById("chart");
    if (!chartElement) return;

    // Remove any existing canvas to avoid duplicates
    d3.select(chartElement).selectAll("canvas").remove();
    const width = window.innerWidth - 6;
    const height = window.innerHeight - 6;

    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d?.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const pack = (data: Datum) =>
      d3
        .pack<Datum>()
        .size([width, height])
        .padding(8)(d3.hierarchy(data).sum((d) => d.value ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const root = pack(hierarchy);

    createCircularPacking(root, width, height);
  }, [data]);

  const onClickSingle = () => {
    const newGroups: any[] = [];

    for (let i = 0; i < singleData; i++) {
      const singleData = {
        name: "datafy-api-gateway",
        value: getRandomElement(sizes),
        type: getRandomElement(names),
      };

      newGroups.push(singleData);
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
        // {
        //   name: "datafy-api-gateway",
        //   value: getRandomElement(sizes),
        //   type: getRandomElement(names),
        // },
      ],
    });
    if (itemsRef.current) {
      (itemsRef.current as HTMLInputElement).value = "";
    }
  };

  return (
    <>
      <div id="chart"></div>

      <div className="btns">
        <div className="group1">
          <button id="increaseBtn" onClick={() => {}}>
            +
          </button>
          <button id="decreaseBtn" onClick={() => {}}>
            -
          </button>
        </div>
      </div>

      <div className="floatform">
        <div className="form">
          <div className="form__left">
            <label htmlFor="single">Number of single data:</label>
            <input
              id="single"
              type="text"
              onChange={(e) => setSingleData(Number(e.target.value))}
            />
          </div>
          <button id="single" onClick={onClickSingle}>
            Add single data
          </button>
        </div>
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
  root: d3.HierarchyCircularNode<Datum>,
  width: number,
  height: number
) {
  const canvas = d3
    .select("#chart")
    .append("canvas")
    .attr("id", "canvas")
    .attr("width", width)
    .attr("height", height);

  const context = canvas.node()?.getContext("2d");

  const childrenNodes = root.descendants().filter((d) => !d.children);
  const parentNodes = root.descendants().filter((d) => d.children);

  // Find the largest parent node
  const largestParentNode = parentNodes.reduce((max, node) => {
    return node.r > max.r ? node : max;
  }, parentNodes[0]);

  //   console.log("largestParentNode", largestParentNode);

  function draw(transform: any) {
    context?.save();
    context?.clearRect(0, 0, width, height);
    createParentNodes(transform, parentNodes, context);
    createChildrenNodes(transform, childrenNodes, context);
    context?.restore();
  }

  draw(d3.zoomIdentity);

  //   largest radius check
  const largestRadius = largestParentNode?.r ? largestParentNode?.r : 1;

  // Zoom/Drag handler
  const zoom_function = d3
    .zoom()
    .scaleExtent([MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL])
    .translateExtent([
      [-width + largestRadius / 2 + width, -height + height], // Minimum translation (top-left corner)
      [width - largestRadius / 2, height], // Maximum translation (bottom-right corner)
    ])
    .on("zoom", (e) => {
      const transform = e.transform;
      context?.save();
      requestAnimationFrame(() => draw(transform));
      context?.restore();
    });

  d3.select("#increaseBtn").on("click", () => {
    canvas.transition().call(zoom_function.scaleBy as any, 1.2);
  });

  d3.select("#decreaseBtn").on("click", () => {
    canvas.transition().call(zoom_function.scaleBy as any, 0.7);
  });

  canvas.call(zoom_function as any);
}

function createChildrenNodes(
  transform: d3.ZoomTransform,
  nodes: d3.HierarchyCircularNode<Datum>[],
  context: CanvasRenderingContext2D | null | undefined
) {
  if (context) {
    // for children circles
    nodes.forEach((node) => {
      //   console.log("node", node);
      const x = transform.applyX(node.x);
      const y = transform.applyY(node.y);
      const r = transform.k * node.r;

      // Set the shadow properties
      context.shadowColor = "rgba(0, 0, 0, 0.5)"; // color of the shadow
      context.shadowBlur = 10; // blur radius of the shadow
      context.shadowOffsetX = 0; // horizontal offset of the shadow
      context.shadowOffsetY = 0; // vertical offset of the shadow

      context.fillStyle =
        transform.k > 2.5 ? "rgba(255, 255, 255, 1)" : "rgba(66, 84, 251, 0)";
      context.beginPath();
      context.arc(x, y, r, 0, 2 * Math.PI, true);
      context.fill();
      context.closePath();

      // Reset the shadow properties after drawing
      context.shadowColor = "rgba(0, 0, 0, 0)";
      context.shadowBlur = 0;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
    });

    // for children label
    nodes.forEach((node) => {
      const x = transform.applyX(node.x);
      const y = transform.applyY(node.y);
      const r = transform.k * node.r;

      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "rgb(92,99,128)";
      context.font = `${r * 0.2}px sans-serif`; // Adjust font size based on circle radius
      context.fillText(node.data.data?.name ?? "", x, y + r * 0.15);
    });

    // for children type
    nodes.forEach((node) => {
      const x = transform.applyX(node.x);
      const y = transform.applyY(node.y);
      const r = transform.k * node.r;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle =
        node.data.data?.type === "EC2"
          ? "rgba(24, 146,77, 1)"
          : "rgba(239,153,70,1)";
      context.font = `${r * 0.2}px sans-serif`; // Adjust font size based on circle radius
      context.fillText(node.data.data?.type ?? "", x, y + r * -0.2);
    });

    // for children type box
    nodes.forEach((node) => {
      const x = transform.applyX(node.x);
      const y = transform.applyY(node.y);
      const r = transform.k * node.r;
      const fontSize = r * 0.2;

      context.font = `${fontSize}px sans-serif`;

      // Measure text size
      const textWidth = context.measureText(node.data.data?.type ?? "").width;

      // Calculate box dimensions
      const boxWidth = textWidth + fontSize * 0.5; // Add padding
      const boxHeight = fontSize * 1.5; // Adjust as needed

      context.fillStyle =
        node.data.data.type === "EC2"
          ? "rgba(37, 207,119, 0.3)"
          : node.data.data.type === "EKS"
          ? "rgba(255,241,189, 0.5)"
          : "none";
      context.beginPath();
      context.roundRect(
        x - boxWidth / 2,
        y + r * -0.36,
        boxWidth,
        boxHeight,
        10
      );
      context.fill();
    });
  }
}

function createParentNodes(
  transform: d3.ZoomTransform,
  nodes: d3.HierarchyCircularNode<Datum>[],
  context: CanvasRenderingContext2D | null | undefined
) {
  //   console.log("k", k);
  nodes.slice(1).forEach((node) => {
    const x = transform.applyX(node.x);
    const y = transform.applyY(node.y);
    const r = transform.k * node.r;
    if (context) {
      context.fillStyle = "rgba(66, 84, 251, 0.05)";
      context.beginPath();
      context.arc(x, y, r, 0, 2 * Math.PI, true);
      context.fill();
      context.closePath();
    }
  });
}
