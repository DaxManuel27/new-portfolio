import json,math,pathlib
root=pathlib.Path(__file__).parent
names=['Intro','Hack Atlantic','Formula SAE','Ultra Maritime','Projects','Resume','Contact']
sources=['49:5958','48:6021','48:6638','49:6477','49:7128','49:7871']
intents=['Forward flip','Lift and turntable spin','Barrel roll; open on landing','Close, rise, underside reveal','Half-open turntable; profile readable','Stay open; slow yaw and slide']
pitch=[[0,55,100,200,360],[360,372,372,364,360],[360,350,350,360,360],[360,340,285,345,360],[360,360,365,365,360],[360,355,352,360,360]]
yaw=[[25,25,25,25,-17.3],[-17.3,-20,120,290,385],[385,390,380,345,334.5],[334.5,334.5,240,60,-25.5],[-25.5,0,90,200,385],[385,370,325,365,385]]
roll=[[0,-10,-25,-15,0],[0,0,0,0,0],[0,-40,-180,-330,-360],[-360]*5,[-360]*5,[-360]*5]
lids=[[0,0,0,0,106],[106,0,0,0,0],[0,0,0,45,106],[106,20,0,50,106],[106,45,45,70,106],[106]*5]
pixels=[[[770,698],[720,470],[720,470],[820,500],[977,582]],[[977,582],[900,420],[720,430],[520,470],[407,658]],[[407,658],[560,400],[700,400],[800,430],[690,585]],[[690,585],[780,330],[720,420],[620,430],[550,546]],[[550,546],[600,360],[720,420],[600,450],[513,673]],[[513,673],[493,623],[481,613],[460,634],[450,664]]]
land=[[0,0,.74],[2.075,0,.74],[3.75,0,.74],[6,0,.74],[7.9,0,.74],[9.7,.045,.74],[11.72,.06,.74]]
data={'version':'1.0','date':'2026-10-01','file_key':'AAoP4nNd3n9QzR9C2Cjarm','source_board':'48:5573','status':'Figma-authored design specification; Blender camera fit and mechanical anchor verification pending','units':'metres / degrees','coordinate_system':{'X':'right','Y':'toward desk back','Z':'up','rotation_order':'XYZ; fields pitch=X, roll=Y, yaw=Z','root':'virtual feet contact point; adapt existing Blender rig with parent offset','physical_scale':1},'timing':{'start_hold':[0,.1],'end_hold':[.9,1],'ease':'cubic smoothstep 3t²-2t³ per segment; zero slope at holds','reverse':'evaluate the same progress backwards; do not integrate','scroll_distance_vh':150},'camera_note':'Metric camera seeds are concrete design values, not solved render matches. Fit to the linked endpoint pixel landmarks in Blender while retaining scale. Figma source scale values are framing cues, never mesh scale animation.','transitions':[]}
for i in range(6):
    poses=[]
    for j,p in enumerate([.1,.3,.5,.7,.9]):
        f=j/4;pos=[land[i][k]*(1-f)+land[i+1][k]*f for k in range(3)]
        pos[2]+=[0,.36,.46,.26,0][j] if i!=5 else [0,.07,.09,.055,0][j]
        target=[pos[0],pos[1],pos[2]+.08];camera=[target[0],target[1]-1.8,target[2]+.905]
        poses.append({'p':p,'phase':['Departure','Lift','Rotation','Approach','Landing'][j],'position_m':[round(v,4) for v in pos],'pitch_deg':pitch[i][j],'yaw_deg':yaw[i][j],'roll_deg':roll[i][j],'lid_deg':lids[i][j],'camera_position_m':[round(v,4) for v in camera],'camera_target_m':[round(v,4) for v in target],'camera_roll_deg':0,'lens_mm':50,'sensor_width_mm':36,'frame_px':[1440,960],'subject_target_px':pixels[i][j],'station_visibility':{'from':[1,.45,0,0,0][j],'to':[0,0,0,.45,1][j]}})
    poses=[dict(poses[0],p=0,phase='Start hold')]+poses+[dict(poses[-1],p=1,phase='End hold')]
    data['transitions'].append({'id':i+1,'from':names[i],'to':names[i+1],'intent':intents[i],'source_node':sources[i],'poses':poses})
data['push_ins']=[{'station':s,'source_node':n,'frame_px':[1440,960],'laptop_bounds_px':b,'relative_camera_yaw_deg':0,'camera_roll_deg':0,'elevation_seed_deg':12,'holds':[[0,.1],[.9,1]],'easing':'smoothstep','framing':note} for s,n,b,note in [('Hack Atlantic','54:6828',[363.655,176.545,713.6875,665],'A standee cropped at each edge'),('Ultra Maritime','54:6950',[232.3702,70.43,976.625,910],'Straight-on; preserve keyboard and slight bottom crop'),('Projects','54:7071',[232.3702,70.43,976.625,910],'Same laptop framing as Ultra')]]
data['birdseye']=[{'station':s,'source_node':n,'camera_elevation_end_deg':90,'camera_roll_deg':0,'projection':'orthographic','ortho_width_m':w,'target_station_local_m':t,'start_hold':[0,.1],'end_hold':[.9,1]} for s,n,w,t in [('Resume','55:7271',.45,[.23,-.12,.742]),('Contact','13:2882',.48,[.11,-.16,.748])]]
data['paper_feed']={'page_mm':[215.9,279.4,.1],'centre_x_m':.23,'height_m':.742,'leading_edge_Y_m':[[0,.21],[.1,.21],[.3,.0197],[.5,-.0921],[.9,-.2597],[1,-.2597]],'sheet_trails_leading_edge_along':'+Y','printer_mask':'hide portion behind front slot; deterministic clip/occlusion','state':['hidden','emerging','printed'],'no_emission':True}
data['accessibility']={'mobile':'use existing mobile scenes 15:770–15:926 with same asset set; keep labels >=16 CSS px, use tighter camera framing','reduced_motion':'static landed checkpoint; optional 150 ms dissolve; disable flips/rolls/travel and paper movement; show printed state','no_second_asset_set':True}
data['version']='1.1'
data['framing_rule']={'default_target_normalized':[.5,.5],'hero_max_width_fraction':.56,'hero_max_height_fraction':.64,'exception':'Formula SAE landed/start hold X=0.28; recenter by lift. Other sideways moves only when station composition requires them.','physical_scale':1,'station_overview':'Full-station cards are context; blend overview after hero landing hold.','camera_fit':'Fit evaluated laptop bounds within width/height fractions; smooth camera distance across poses to avoid pumping.'}
for i,t in enumerate(data['transitions']):
    for k in t['poses']:
        side=(i==1 and k['p']>=.9) or (i==2 and k['p']<=.1)
        k['subject_target_px']=[403.2 if side else 720,480]
        k['subject_target_normalized']=[.28 if side else .5,.5]
        k['hero_max_width_fraction']=.48 if side else .56
        k['hero_max_height_fraction']=.64
        # Camera seed moves closer for the larger hero. Final fit uses the frame bounds.
        x,y,z=k['position_m'];offset=.1433 if side else 0
        k['camera_target_m']=[round(x+offset,4),y,round(z+.08,4)]
        k['camera_position_m']=[round(x+offset,4),round(y-.82,4),round(z+.492,4)]
for a,b in zip(data['transitions'],data['transitions'][1:]):
    for k in ['position_m','pitch_deg','yaw_deg','roll_deg','lid_deg','camera_position_m','camera_target_m']:
        assert a['poses'][-1][k]==b['poses'][0][k],(a['id'],k)
(root/'motion-manifest.json').write_text(json.dumps(data,indent=2)+'\n')
