import sys

def parse_router(path):
    with open(path, 'r', encoding='utf8') as f:
        content = f.read()
    
    # We want to extract the children of /dashboard
    # Find path: '/dashboard'
    dash_idx = content.find("path: '/dashboard'")
    if dash_idx == -1:
        print("Could not find /dashboard")
        return
        
    child_start = content.find("children: [", dash_idx)
    if child_start == -1:
        print("Could not find children: [")
        return
        
    # Find matching bracket
    brackets = 0
    i = child_start + 10
    
    while i < len(content):
        if content[i] == '[':
            brackets += 1
        elif content[i] == ']':
            brackets -= 1
            if brackets == 0:
                break
        i += 1
        
    extracted_children = content[child_start + 11: i] # Without the outer brackets
    
    # Replace the createBrowserRouter with our var
    new_content = content.replace("export const router = createBrowserRouter([", "const dashboardRoutes = [" + extracted_children + "];\n\nexport const router = createBrowserRouter([")
    
    # In the new_content, find the original /dashboard children block and replace it
    dash_idx2 = new_content.find("path: '/dashboard'")
    child_start2 = new_content.find("children: [", dash_idx2)
    brackets = 0
    i2 = child_start2 + 10
    while i2 < len(new_content):
        if new_content[i2] == '[':
            brackets += 1
        elif new_content[i2] == ']':
            brackets -= 1
            if brackets == 0:
                break
        i2 += 1
    
    new_content = new_content[:child_start2] + "children: dashboardRoutes" + new_content[i2+1:]
    
    # In the new_content, find /admin children block and replace it
    admin_idx = new_content.find("path: '/admin'")
    if admin_idx != -1:
        child_start3 = new_content.find("children: [", admin_idx)
        if child_start3 != -1:
            brackets = 0
            i3 = child_start3 + 10
            while i3 < len(new_content):
                if new_content[i3] == '[':
                    brackets += 1
                elif new_content[i3] == ']':
                    brackets -= 1
                    if brackets == 0:
                        break
                i3 += 1
            new_content = new_content[:child_start3] + "children: dashboardRoutes" + new_content[i3+1:]
            
    with open(path, 'w', encoding='utf8') as f:
        f.write(new_content)
    
    print("Fixed!")

parse_router('dashboard/src/router.jsx')
