import { Filters, Roles } from "../../util-lib";
import { HelpMenus } from "./MenuDeclarations";

HelpMenus.OnboardingHome.allowed = Filters.RoleAuth([Roles.Creator.id]);


