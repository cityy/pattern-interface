# pattern-interface

Pattern Interface is translating parts of Christopher Alexander's Timeless Way of Building (1977) to a Web Interface.

Ferdinand List - ferdinand.list at gmail dot com

## Roadmap

### HUD
- [X] add nodes
  - [X] if nodes are selected, add edges to selected nodes
- [X] remove selected nodes and corresponding edges
- [X] edit nodes
	- [X] disable edit if more/less than 1 node is selected
- [X] connect nodes
	- [X] disable connect id more/less than 2 nodes are selected
- [ ] zoom, zoomlevel
- [ ] pan
- [ ] save current language to database

### Frontend 
- [ ] add a way to display pattern contents
- [ ] add hierarchy

### Backend 
- [ ] use a database to generate and handle nodes / edges (OrientDB)
	- [ X ] initialize nodes and edges from the database
	- [  ] operate all edge/node updates on the database
- [ ] add users
- [ ] add user projects / user languages

### Content
- [ ] add global language patterns
- [ ] add global language patterns' diagrams
- [ ] set global language clusters

### AI
- [ ] compare user languages to global language
  - [ ] evaluate quantity of user defined connections in comparison to the global language