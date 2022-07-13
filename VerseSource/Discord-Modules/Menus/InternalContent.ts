import { Filters, Roles } from "../../util-lib";
import { HelpMenus } from "./MenuDeclarations";

HelpMenus.InternalContent.allowed = Filters.RoleAuth([Roles.Creator.id]);