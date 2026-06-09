---
title: "Navigator"
description: "A navigation application for vehicles with special street permits."
stack: ["Flutter", "Valhalla"]
date: 2025-01-01
weight: 2
year: "2025"
role: "contract"
status: "shipped"
---

## Problem

[BTB Logistik](https://www.btb-logistik.de/) is a logistics company operating mobile cranes. Extremely heavy vehicles like these cranes need a special permit to operate legally in Germany. Each permit lists the streets a vehicle must avoid. This includes bridges, tunnels and and structurally weak roads, because its weight would damage these.

## Solution

Working closely with BTB, I built a web interface for managing these restricted streets, backed by a routing engine that calculates the optimal route while avoiding every banned segment.

Afterwards I developed a mobile application to display the route and guide the driver of the cranes to their destination.


## Try it

Block a few streets and watch the route adapt — powered by the same Valhalla routing engine used in the project.

{{< route-demo >}}
